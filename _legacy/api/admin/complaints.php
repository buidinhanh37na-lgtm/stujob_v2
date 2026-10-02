<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH ============ */
if ($m === 'GET' && $action === 'list') {
    $status = $_GET['status'] ?? 'all';
    $priority = $_GET['priority'] ?? 'all';
    $search = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT kn.*,
            CASE
                WHEN kn.nguoi_gui_loai='sinh_vien' THEN (SELECT ho_ten FROM sinh_vien WHERE id=kn.nguoi_gui_id)
                WHEN kn.nguoi_gui_loai='nha_tuyen_dung' THEN (SELECT ten_cong_ty FROM nha_tuyen_dung WHERE id=kn.nguoi_gui_id)
            END AS nguoi_gui_ten,
            CASE
                WHEN kn.doi_tuong_loai='sinh_vien' THEN (SELECT ho_ten FROM sinh_vien WHERE id=kn.doi_tuong_id)
                WHEN kn.doi_tuong_loai='nha_tuyen_dung' THEN (SELECT ten_cong_ty FROM nha_tuyen_dung WHERE id=kn.doi_tuong_id)
                ELSE 'Hệ thống'
            END AS doi_tuong_ten,
            v.tieu_de AS ten_viec,
            a.ho_ten AS admin_name
            FROM khieu_nai kn
            LEFT JOIN viec_lam v ON v.id = kn.viec_lam_id
            LEFT JOIN quan_tri_vien a ON a.id = kn.admin_id
            WHERE 1=1";
    $params = [];

    if ($status !== 'all') { $sql .= " AND kn.trang_thai=?"; $params[] = $status; }
    if ($priority !== 'all') { $sql .= " AND kn.uu_tien=?"; $params[] = $priority; }
    if ($search) {
        $sql .= " AND (kn.tieu_de LIKE ? OR kn.noi_dung LIKE ?)";
        $like = "%$search%";
        array_push($params, $like, $like);
    }

    $sql .= " ORDER BY
        FIELD(kn.uu_tien, 'khan_cap','cao','trung_binh','thap'),
        kn.created_at DESC LIMIT $limit OFFSET $offset";

    $st = $pdo->prepare($sql);
    $st->execute($params);
    json_out(['success'=>true, 'items'=>$st->fetchAll(), 'page'=>$page]);
}

/* ============ CHI TIẾT ============ */
if ($m === 'GET' && $action === 'detail') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    $st = $pdo->prepare("SELECT kn.*,
        CASE
            WHEN kn.nguoi_gui_loai='sinh_vien' THEN (SELECT ho_ten FROM sinh_vien WHERE id=kn.nguoi_gui_id)
            WHEN kn.nguoi_gui_loai='nha_tuyen_dung' THEN (SELECT ten_cong_ty FROM nha_tuyen_dung WHERE id=kn.nguoi_gui_id)
        END AS nguoi_gui_ten,
        CASE
            WHEN kn.doi_tuong_loai='sinh_vien' THEN (SELECT ho_ten FROM sinh_vien WHERE id=kn.doi_tuong_id)
            WHEN kn.doi_tuong_loai='nha_tuyen_dung' THEN (SELECT ten_cong_ty FROM nha_tuyen_dung WHERE id=kn.doi_tuong_id)
            ELSE 'Hệ thống'
        END AS doi_tuong_ten,
        v.tieu_de AS ten_viec
        FROM khieu_nai kn
        LEFT JOIN viec_lam v ON v.id = kn.viec_lam_id
        WHERE kn.id = ?");
    $st->execute([$id]);
    $kn = $st->fetch();
    if (!$kn) json_out(['success'=>false,'message'=>'Không tìm thấy']);

    $escrow = null;
    if ($kn['viec_lam_id']) {
        $es = $pdo->prepare("SELECT * FROM bao_dam_thanh_toan WHERE viec_lam_id=? ORDER BY created_at DESC LIMIT 1");
        $es->execute([$kn['viec_lam_id']]);
        $escrow = $es->fetch();
    }

    $hoanTien = [];
    try {
        $ht = $pdo->prepare("SELECT * FROM lich_su_hoan_tien WHERE khieu_nai_id=? ORDER BY created_at DESC");
        $ht->execute([$id]);
        $hoanTien = $ht->fetchAll();
    } catch (Exception $e) {}

    json_out(['success'=>true, 'khieu_nai'=>$kn, 'escrow'=>$escrow, 'lich_su_hoan_tien'=>$hoanTien]);
}

/* ============ TẠO KHIẾU NẠI ============ */
if ($m === 'POST' && $action === 'create') {
    $d = body();
    $nguoiGuiLoai = $d['nguoi_gui_loai'] ?? '';
    $nguoiGuiId = (int)($d['nguoi_gui_id'] ?? 0);
    $doiTuongLoai = $d['doi_tuong_loai'] ?? null;
    $doiTuongId = !empty($d['doi_tuong_id']) ? (int)$d['doi_tuong_id'] : null;
    $viecLamId = !empty($d['viec_lam_id']) ? (int)$d['viec_lam_id'] : null;
    $tieuDe = trim($d['tieu_de'] ?? '');
    $noiDung = trim($d['noi_dung'] ?? '');
    $bangChung = trim($d['bang_chung'] ?? '');

    if (!$tieuDe || !$noiDung)
        json_out(['success'=>false,'message'=>'Thiếu tiêu đề hoặc nội dung']);

    $ins = $pdo->prepare("INSERT INTO khieu_nai
        (nguoi_gui_loai, nguoi_gui_id, doi_tuong_loai, doi_tuong_id,
         viec_lam_id, tieu_de, noi_dung, bang_chung)
        VALUES (?,?,?,?,?,?,?,?)");
    $ins->execute([$nguoiGuiLoai, $nguoiGuiId, $doiTuongLoai, $doiTuongId,
                    $viecLamId, $tieuDe, $noiDung, $bangChung]);

    $newId = $pdo->lastInsertId();
    notify_admin($pdo, null, 'Có khiếu nại mới', "Khiếu nại: $tieuDe", 'warning');
    json_out(['success'=>true, 'message'=>'Đã gửi khiếu nại', 'id'=>$newId]);
}

/* ============ TIẾP NHẬN ============ */
if ($m === 'POST' && $action === 'take') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    $priority = $d['uu_tien'] ?? 'trung_binh';
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    $pdo->prepare("UPDATE khieu_nai SET trang_thai='dang_xu_ly', admin_id=?, uu_tien=? WHERE id=?")
        ->execute([$admin, $priority, $id]);
    log_admin($pdo, $admin, 'take_complaint', 'khieu_nai', $id);
    json_out(['success'=>true,'message'=>'Đã tiếp nhận']);
}

/* ============ HÒA GIẢI + KẾT LUẬN ============ */
if ($m === 'POST' && $action === 'resolve') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    $ketQua = trim($d['ket_qua'] ?? '');
    $huongXuLy = $d['huong_xu_ly'] ?? '';
    $soTienHoan = (float)($d['so_tien_hoan'] ?? 0);

    if (!$id || !$ketQua) json_out(['success'=>false,'message'=>'Thiếu kết quả']);
    $allowed = ['hoan_tien_sv','hoan_tien_ntd','chia_doi','khong_hoan','khac'];
    if (!in_array($huongXuLy, $allowed)) json_out(['success'=>false,'message'=>'Hướng xử lý không hợp lệ']);

    $st = $pdo->prepare("SELECT * FROM khieu_nai WHERE id=?");
    $st->execute([$id]);
    $kn = $st->fetch();
    if (!$kn) json_out(['success'=>false,'message'=>'Không tìm thấy']);

    $pdo->beginTransaction();
    try {
        // 1. Update khiếu nại
        $pdo->prepare("UPDATE khieu_nai SET
            trang_thai='da_giai_quyet', admin_id=?, ket_qua=?,
            huong_xu_ly=?, so_tien_hoan=?, resolved_at=NOW()
            WHERE id=?")
            ->execute([$admin, $ketQua, $huongXuLy, $soTienHoan, $id]);

        // 2. Xử lý hoàn tiền
        if ($soTienHoan > 0 && in_array($huongXuLy, ['hoan_tien_sv','hoan_tien_ntd','chia_doi'])) {
            $es = null;
            if ($kn['viec_lam_id']) {
                $esSt = $pdo->prepare("SELECT * FROM bao_dam_thanh_toan
                    WHERE viec_lam_id=? AND trang_thai IN ('da_nap','cho_nghiem_thu')
                    ORDER BY created_at DESC LIMIT 1");
                $esSt->execute([$kn['viec_lam_id']]);
                $es = $esSt->fetch();
            }

            if ($es) {
                // Hoàn cho SV
                if ($huongXuLy === 'hoan_tien_sv' || $huongXuLy === 'chia_doi') {
                    $tienSV = $huongXuLy === 'chia_doi' ? $soTienHoan / 2 : $soTienHoan;
                    $pdo->prepare("INSERT IGNORE INTO vi_tien (sinh_vien_id, so_du) VALUES (?, 0)")
                        ->execute([$es['sinh_vien_id']]);
                    $pdo->prepare("UPDATE vi_tien SET so_du = so_du + ? WHERE sinh_vien_id=?")
                        ->execute([$tienSV, $es['sinh_vien_id']]);

                    $pdo->prepare("INSERT INTO lich_su_hoan_tien
                        (khieu_nai_id, bao_dam_id, nguoi_nhan_loai, nguoi_nhan_id, so_tien, ly_do, admin_id)
                        VALUES (?,?, 'sinh_vien', ?, ?, ?, ?)")
                        ->execute([$id, $es['id'], $es['sinh_vien_id'], $tienSV, $ketQua, $admin]);

                    $pdo->prepare("INSERT INTO giao_dich
                        (sinh_vien_id, so_tien, loai, mo_ta, trang_thai)
                        VALUES (?,?, 'thu_nhap', ?, 'thanh_cong')")
                        ->execute([$es['sinh_vien_id'], $tienSV, 'Hoàn tiền từ khiếu nại #' . $id]);
                }

                // Hoàn cho NTD
                if ($huongXuLy === 'hoan_tien_ntd' || $huongXuLy === 'chia_doi') {
                    $tienNTD = $huongXuLy === 'chia_doi' ? $soTienHoan / 2 : $soTienHoan;
                    $pdo->prepare("INSERT IGNORE INTO vi_ntd (nha_tuyen_dung_id, so_du) VALUES (?, 0)")
                        ->execute([$es['nha_tuyen_dung_id']]);
                    $pdo->prepare("UPDATE vi_ntd SET so_du = so_du + ? WHERE nha_tuyen_dung_id=?")
                        ->execute([$tienNTD, $es['nha_tuyen_dung_id']]);

                    $pdo->prepare("INSERT INTO lich_su_hoan_tien
                        (khieu_nai_id, bao_dam_id, nguoi_nhan_loai, nguoi_nhan_id, so_tien, ly_do, admin_id)
                        VALUES (?,?, 'nha_tuyen_dung', ?, ?, ?, ?)")
                        ->execute([$id, $es['id'], $es['nha_tuyen_dung_id'], $tienNTD, $ketQua, $admin]);
                }

                // Update escrow
                $pdo->prepare("UPDATE bao_dam_thanh_toan SET trang_thai='hoan_tien' WHERE id=?")
                    ->execute([$es['id']]);
            }
        }

        // 3. Thông báo 2 bên
        if ($kn['nguoi_gui_loai'] === 'sinh_vien') {
            if (function_exists('save_sv_notification')) {
                save_sv_notification($pdo, $kn['nguoi_gui_id'], 'Khiếu nại đã được giải quyết',
                    "Kết quả: $ketQua", 'success');
            }
        } else {
            $pdo->prepare("INSERT INTO thong_bao_ntd (nha_tuyen_dung_id, tieu_de, noi_dung, loai)
                VALUES (?,?,?,'success')")
                ->execute([$kn['nguoi_gui_id'], 'Khiếu nại đã được giải quyết', "Kết quả: $ketQua"]);
        }

        log_admin($pdo, $admin, 'resolve_complaint', 'khieu_nai', $id,
            "Hướng: $huongXuLy, Hoàn: $soTienHoan");

        $pdo->commit();
        json_out(['success'=>true,'message'=>'Đã giải quyết khiếu nại']);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_out(['success'=>false,'message'=>'Lỗi: ' . $e->getMessage()]);
    }
}

/* ============ ĐÓNG ============ */
if ($m === 'POST' && $action === 'close') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    $reason = trim($d['ly_do'] ?? 'Đóng khiếu nại');
    $pdo->prepare("UPDATE khieu_nai SET trang_thai='da_dong', admin_id=?, ket_qua=?, resolved_at=NOW() WHERE id=?")
        ->execute([$admin, $reason, $id]);
    log_admin($pdo, $admin, 'close_complaint', 'khieu_nai', $id, $reason);
    json_out(['success'=>true,'message'=>'Đã đóng khiếu nại']);
}

/* ============ STATS ============ */
if ($m === 'GET' && $action === 'stats') {
    $st = $pdo->query("SELECT
        SUM(CASE WHEN trang_thai='cho_xu_ly' THEN 1 ELSE 0 END) AS cho_xu_ly,
        SUM(CASE WHEN trang_thai='dang_xu_ly' THEN 1 ELSE 0 END) AS dang_xu_ly,
        SUM(CASE WHEN trang_thai='da_giai_quyet' THEN 1 ELSE 0 END) AS da_giai_quyet,
        SUM(CASE WHEN trang_thai='da_dong' THEN 1 ELSE 0 END) AS da_dong,
        SUM(CASE WHEN uu_tien='khan_cap' AND trang_thai IN ('cho_xu_ly','dang_xu_ly') THEN 1 ELSE 0 END) AS khan_cap,
        COUNT(*) AS tong
        FROM khieu_nai");
    $stats = $st->fetch();

    $hoanTien = 0;
    try {
        $hoanTien = (float)$pdo->query("SELECT IFNULL(SUM(so_tien),0) FROM lich_su_hoan_tien")->fetchColumn();
    } catch (Exception $e) {}

    json_out(['success'=>true, 'khieu_nai'=>$stats, 'tong_hoan_tien'=>$hoanTien]);
}


/* ============ THỐNG KÊ THEO MỨC ĐỘ ============ */
if ($m === 'GET' && $action === 'stats-by-priority') {
    $st = $pdo->query("SELECT
        SUM(CASE WHEN uu_tien='khan_cap' THEN 1 ELSE 0 END) AS khan_cap,
        SUM(CASE WHEN uu_tien='cao' THEN 1 ELSE 0 END) AS cao,
        SUM(CASE WHEN uu_tien='trung_binh' THEN 1 ELSE 0 END) AS trung_binh,
        SUM(CASE WHEN uu_tien='thap' THEN 1 ELSE 0 END) AS thap,
        COUNT(*) AS tong
        FROM khieu_nai");

    $byStatus = $pdo->query("SELECT trang_thai, COUNT(*) AS so_luong
        FROM khieu_nai GROUP BY trang_thai")->fetchAll();

    json_out([
        'success'=>true,
        'by_priority'=>$st->fetch(),
        'by_status'=>$byStatus
    ]);
}