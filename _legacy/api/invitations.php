<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============================================================
   DANH SÁCH LỜI MỜI
   ============================================================ */
if ($m === 'GET' && $action === 'list') {
    $status = $_GET['status'] ?? 'cho_duyet';
    $sql = "SELECT ut.id, ut.loi_nhan, ut.trang_thai, ut.created_at, ut.ngay_moi,
            v.id AS viec_lam_id, v.tieu_de, v.mo_ta, v.ky_nang_can,
            v.luong_min, v.luong_max, v.don_vi_luong,
            v.loai_cong_viec, v.thu_lam_viec, v.gio_bat_dau, v.gio_ket_thuc,
            v.han_chot, v.ngay_bat_dau, v.ngay_ket_thuc, v.dia_chi_lam_viec,
            v.so_luong_can, v.so_buoi, v.gio_uoc_tinh,
            n.id AS ntd_id, n.ten_cong_ty, n.logo, n.linh_vuc,
            n.dia_chi AS ntd_dia_chi, n.vi_do, n.kinh_do
            FROM ung_tuyen ut
            JOIN viec_lam v ON v.id = ut.viec_lam_id
            JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
            WHERE ut.sinh_vien_id = ? AND ut.loai = 'loi_moi'";
    $params = [$svId];

    if ($status !== 'all') {
        $sql .= " AND ut.trang_thai = ?";
        $params[] = $status;
    }
    $sql .= " ORDER BY ut.created_at DESC LIMIT 100";

    $st = $pdo->prepare($sql);
    $st->execute($params);
    $items = $st->fetchAll();

    // Đếm chưa đọc
    $countSt = $pdo->prepare("SELECT COUNT(*) FROM ung_tuyen
        WHERE sinh_vien_id = ? AND loai = 'loi_moi' AND trang_thai = 'cho_duyet'");
    $countSt->execute([$svId]);
    $pending = (int) $countSt->fetchColumn();

    json_out(['success' => true, 'items' => $items, 'pending' => $pending]);
}

/* ============================================================
   CHI TIẾT 1 LỜI MỜI
   ============================================================ */
if ($m === 'GET' && $action === 'detail') {
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id)
        json_out(['success' => false, 'message' => 'Thiếu ID']);

    $st = $pdo->prepare("SELECT ut.*, v.tieu_de, v.mo_ta, v.ky_nang_can,
            v.luong_min, v.luong_max, v.don_vi_luong,
            v.loai_cong_viec, v.thu_lam_viec, v.gio_bat_dau, v.gio_ket_thuc,
            v.han_chot, v.ngay_bat_dau, v.ngay_ket_thuc, v.dia_chi_lam_viec,
            v.so_luong_can, v.so_buoi, v.gio_uoc_tinh,
            n.ten_cong_ty, n.logo, n.linh_vuc, n.dia_chi AS ntd_dia_chi,
            n.vi_do, n.kinh_do, n.email AS ntd_email, n.so_dien_thoai AS ntd_sdt
            FROM ung_tuyen ut
            JOIN viec_lam v ON v.id = ut.viec_lam_id
            JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
            WHERE ut.id = ? AND ut.sinh_vien_id = ? AND ut.loai = 'loi_moi'");
    $st->execute([$id, $svId]);
    $item = $st->fetch();
    if (!$item)
        json_out(['success' => false, 'message' => 'Không tìm thấy lời mời']);

    json_out(['success' => true, 'invitation' => $item]);
}

/* ============================================================
   CHẤP NHẬN LỜI MỜI
   ============================================================ */
if ($m === 'POST' && $action === 'accept') {
    $d = body();
    $id = (int) ($d['id'] ?? 0);
    if (!$id)
        json_out(['success' => false, 'message' => 'Thiếu ID']);

    $st = $pdo->prepare("SELECT ut.*,
                     v.tieu_de, v.mo_ta, v.luong_min, v.luong_max,
                     v.han_chot, v.ngay_bat_dau, v.ngay_ket_thuc, v.phi_dich_vu,
                     v.nha_tuyen_dung_id
                     FROM ung_tuyen ut
                     JOIN viec_lam v ON v.id = ut.viec_lam_id
                     WHERE ut.id = ? AND ut.sinh_vien_id = ? AND ut.loai = 'loi_moi'");
    $st->execute([$id, $svId]);
    $ut = $st->fetch();
    if (!$ut)
        json_out(['success' => false, 'message' => 'Không tìm thấy']);
    if ($ut['trang_thai'] !== 'cho_duyet')
        json_out(['success' => false, 'message' => 'Lời mời đã được xử lý']);

    $pdo->beginTransaction();
    try {
        // 1. Đổi trạng thái lời mời → đã chấp nhận
        $pdo->prepare("UPDATE ung_tuyen SET trang_thai='da_chap_nhan' WHERE id=?")
            ->execute([$id]);

        // 2. Tạo nhiệm vụ cho SV
        $deadline = $ut['han_chot'] ? $ut['han_chot'] . ' 23:59:59'
            : ($ut['ngay_ket_thuc'] ? $ut['ngay_ket_thuc'] . ' 23:59:59'
                : date('Y-m-d H:i:s', strtotime('+7 days')));

        $pdo->prepare("INSERT INTO nhiem_vu
            (sinh_vien_id, viec_lam_id, ten_nhiem_vu, mo_ta, han_nop, trang_thai)
            VALUES (?,?,?,?,?, 'dang_lam')")
            ->execute([
                $svId,
                $ut['viec_lam_id'],
                $ut['tieu_de'],
                $ut['mo_ta'],
                $deadline
            ]);

        // 3. Tạo escrow (NTD cần ký quỹ)
        $escrowCode = 'ESC' . time() . rand(100, 999);
        $salary = ($ut['luong_min'] + $ut['luong_max']) / 2;
        $fee = (float) $ut['phi_dich_vu'];

        // Kiểm tra có nha_tuyen_dung_id không trước khi insert
        if (empty($ut['nha_tuyen_dung_id'])) {
            throw new Exception('Không tìm thấy nhà tuyển dụng cho công việc này');
        }

        $pdo->prepare("INSERT INTO bao_dam_thanh_toan
    (ung_tuyen_id, viec_lam_id, nha_tuyen_dung_id, sinh_vien_id,
     so_tien, phi_dich_vu, ma_giao_dich, trang_thai)
    VALUES (?,?,?,?,?,?,?, 'cho_nap')")
            ->execute([
                $id,
                $ut['viec_lam_id'],
                (int) $ut['nha_tuyen_dung_id'],
                $svId,
                $salary,
                $fee,
                $escrowCode
            ]);

        // 4. Thông báo cho NTD
        if (function_exists('save_ntd_notification')) {
            save_ntd_notification(
                $pdo,
                $ut['nha_tuyen_dung_id'] ?? 0,
                'Sinh viên đã chấp nhận lời mời',
                'Sinh viên đã đồng ý làm việc "' . $ut['tieu_de'] . '". Vui lòng ký quỹ escrow.',
                'success'
            );
        }

        // 5. Thông báo cho SV
        save_notification(
            $pdo,
            $svId,
            'Bạn đã chấp nhận lời mời',
            'Hãy liên hệ NTD đểs trao đổi chi tiết công việc.',
            'success'
        );

        $pdo->commit();
        json_out([
            'success' => true,
            'message' => 'Đã chấp nhận lời mời! Vào mục Nhiệm vụ để xem chi tiết.',
            'escrow_code' => $escrowCode
        ]);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_out(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
    }
}

/* ============================================================
   TỪ CHỐI LỜI MỜI
   ============================================================ */
if ($m === 'POST' && $action === 'reject') {
    $d = body();
    $id = (int) ($d['id'] ?? 0);
    $reason = trim($d['ly_do'] ?? '');
    if (!$id)
        json_out(['success' => false, 'message' => 'Thiếu ID']);

    $st = $pdo->prepare("SELECT ut.*, v.tieu_de
        FROM ung_tuyen ut
        JOIN viec_lam v ON v.id = ut.viec_lam_id
        WHERE ut.id = ? AND ut.sinh_vien_id = ? AND ut.loai = 'loi_moi'");
    $st->execute([$id, $svId]);
    $ut = $st->fetch();
    if (!$ut)
        json_out(['success' => false, 'message' => 'Không tìm thấy']);

    $pdo->prepare("UPDATE ung_tuyen SET trang_thai='tu_choi' WHERE id=?")
        ->execute([$id]);

    // Thông báo cho NTD
    if (function_exists('save_ntd_notification')) {
        save_ntd_notification(
            $pdo,
            $ut['nha_tuyen_dung_id'] ?? 0,
            'Sinh viên từ chối lời mời',
            'Sinh viên đã từ chối lời mời cho "' . $ut['tieu_de'] . '".'
            . ($reason ? ' Lý do: ' . $reason : ''),
            'info'
        );
    }

    json_out(['success' => true, 'message' => 'Đã từ chối lời mời']);
}

/* ============================================================
   ĐẾM SỐ LƯỢNG (cho badge)
   ============================================================ */
if ($m === 'GET' && $action === 'count') {
    $st = $pdo->prepare("SELECT COUNT(*) FROM ung_tuyen
        WHERE sinh_vien_id = ? AND loai = 'loi_moi' AND trang_thai = 'cho_duyet'");
    $st->execute([$svId]);
    json_out(['success' => true, 'count' => (int) $st->fetchColumn()]);
}

json_out(['success' => false, 'message' => 'Action không hợp lệ'], 400);