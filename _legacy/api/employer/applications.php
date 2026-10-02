<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($m === 'GET' && $action !== 'detail') {
    $jobId = (int)($_GET['viec_lam_id'] ?? 0);
    $sql = "SELECT ut.*, v.tieu_de, v.luong_min, v.luong_max, v.phi_dich_vu,
                   sv.ma_sinh_vien, sv.ho_ten, sv.truong, sv.gpa,
                   sv.diem_danh_gia, sv.so_lan_danh_gia, sv.anh_dai_dien
            FROM ung_tuyen ut
            JOIN viec_lam v ON v.id=ut.viec_lam_id
            JOIN sinh_vien sv ON sv.id=ut.sinh_vien_id
            WHERE v.nha_tuyen_dung_id=?";
    $params = [$ntdId];
    if ($jobId) { $sql .= " AND ut.viec_lam_id=?"; $params[] = $jobId; }
    $sql .= " ORDER BY ut.created_at DESC";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $items = $st->fetchAll();

    $skStmt = $pdo->prepare("SELECT ten_ky_nang, muc_do FROM ky_nang WHERE sinh_vien_id=?");
    foreach ($items as &$it) {
        $skStmt->execute([$it['sinh_vien_id']]);
        $it['ky_nang'] = $skStmt->fetchAll();
        $it['co_the_chat'] = in_array($it['trang_thai'], ['da_chap_nhan','hoan_thanh']) ? 1 : 0;
    }
    json_out(['success'=>true,'items'=>$items]);
}

if ($m === 'GET' && $action === 'detail') {
    $svId = (int)($_GET['sinh_vien_id'] ?? 0);
    if (!$svId) json_out(['success'=>false,'message'=>'Thiếu sinh_vien_id']);

    // Thông tin cơ bản
    $st = $pdo->prepare("SELECT id, ma_sinh_vien, ho_ten, email, so_dien_thoai,
                         truong, khoa, chuyen_nganh, nam_hoc, gpa, mo_ta,
                         anh_dai_dien, diem_danh_gia, so_lan_danh_gia,
                         trang_thai_xac_thuc, created_at
                         FROM sinh_vien WHERE id=?");
    $st->execute([$svId]);
    $sv = $st->fetch();
    if (!$sv) json_out(['success'=>false,'message'=>'Không tìm thấy sinh viên']);

    // Kỹ năng
    $sk = $pdo->prepare("SELECT ten_ky_nang, muc_do FROM ky_nang WHERE sinh_vien_id=?");
    $sk->execute([$svId]);
    $sv['ky_nang'] = $sk->fetchAll();

    // Chứng chỉ — DÙNG ĐÚNG TÊN CỘT
    $cc = $pdo->prepare("SELECT id, ten_chung_chi, to_chuc, ngay_cap, file_url
                         FROM chung_chi WHERE sinh_vien_id=? ORDER BY id DESC");
    $cc->execute([$svId]);
    $sv['chung_chi'] = $cc->fetchAll();

    // Lịch học (để NTD biết SV rảnh khi nào)
    $lh = $pdo->prepare("SELECT thu, gio_bat_dau, gio_ket_thuc, mon_hoc
                         FROM lich_hoc WHERE sinh_vien_id=?
                         ORDER BY thu, gio_bat_dau");
    $lh->execute([$svId]);
    $sv['lich_hoc'] = $lh->fetchAll();

    // Thống kê
    $stat = $pdo->prepare("SELECT
        (SELECT COUNT(*) FROM ung_tuyen WHERE sinh_vien_id=?) AS so_ung_tuyen,
        (SELECT COUNT(*) FROM nhiem_vu WHERE sinh_vien_id=? AND trang_thai='hoan_thanh') AS so_viec_hoan_thanh,
        (SELECT IFNULL(SUM(so_tien),0) FROM giao_dich WHERE sinh_vien_id=? AND loai='thu_nhap') AS tong_thu_nhap");
    $stat->execute([$svId, $svId, $svId]);
    $sv['thong_ke'] = $stat->fetch();

    json_out(['success'=>true, 'sinh_vien'=>$sv]);
}

if ($m === 'POST' && $action === 'approve') {
    $d = body();
    $utId = (int)($d['ung_tuyen_id'] ?? 0);

    $st = $pdo->prepare("SELECT ut.*, v.tieu_de, v.mo_ta, v.luong_min, v.luong_max,
                         v.phi_dich_vu, v.han_chot
                         FROM ung_tuyen ut
                         JOIN viec_lam v ON v.id=ut.viec_lam_id
                         WHERE ut.id=? AND v.nha_tuyen_dung_id=?");
    $st->execute([$utId, $ntdId]);
    $ut = $st->fetch();
    if (!$ut) json_out(['success'=>false,'message'=>'Không tìm thấy ứng tuyển']);

    $pdo->prepare("UPDATE ung_tuyen SET trang_thai='da_chap_nhan' WHERE id=?")->execute([$utId]);

    // Tạo nhiệm vụ cho SV
    $pdo->prepare("INSERT INTO nhiem_vu
        (sinh_vien_id, viec_lam_id, ten_nhiem_vu, mo_ta, han_nop, trang_thai)
        VALUES (?,?,?,?,?, 'dang_lam')")
        ->execute([
            $ut['sinh_vien_id'], $ut['viec_lam_id'], $ut['tieu_de'],
            $ut['mo_ta'], $ut['han_chot'] . ' 23:59:59'
        ]);

    // Tạo escrow
    $escrowCode = 'ESC' . time() . rand(100, 999);
    $salary = ($ut['luong_min'] + $ut['luong_max']) / 2;
    $fee = (float)$ut['phi_dich_vu'];

    $pdo->prepare("INSERT INTO bao_dam_thanh_toan
        (ung_tuyen_id, viec_lam_id, nha_tuyen_dung_id, sinh_vien_id,
         so_tien, phi_dich_vu, ma_giao_dich, trang_thai)
        VALUES (?,?,?,?,?,?,?, 'cho_nap')")
        ->execute([$utId, $ut['viec_lam_id'], $ntdId, $ut['sinh_vien_id'],
                   $salary, $fee, $escrowCode]);

    // Thông báo SV
    save_sv_notification($pdo, $ut['sinh_vien_id'], 'Ứng tuyển được chấp nhận',
        'Bạn đã được duyệt cho công việc: ' . $ut['tieu_de'] . '. Bạn có thể chat với NTD.',
        'success');

    // Thông báo NTD
    save_ntd_notification($pdo, $ntdId, 'Đã duyệt ứng viên',
        'Vui lòng nạp tiền vào escrow cho công việc: ' . $ut['tieu_de'],
        'escrow');

    json_out([
        'success'=>true,
        'message'=>'Đã duyệt. Vui lòng kích hoạt bảo đảm thanh toán.',
        'escrow_code'=>$escrowCode
    ]);
}

if ($m === 'POST' && $action === 'reject') {
    $d = body();
    $utId = (int)($d['ung_tuyen_id'] ?? 0);
    $pdo->prepare("UPDATE ung_tuyen SET trang_thai='tu_choi' WHERE id=?")->execute([$utId]);
    json_out(['success'=>true,'message'=>'Đã từ chối']);
}

if ($m === 'POST' && $action === 'invite') {
    $d = body();
    $svId = (int)($d['sinh_vien_id'] ?? 0);
    $jobId = (int)($d['viec_lam_id'] ?? 0);
    $message = trim($d['loi_nhan'] ?? '');
    if (!$svId || !$jobId) json_out(['success'=>false,'message'=>'Thiếu dữ liệu']);

    $chk = $pdo->prepare("SELECT id, tieu_de FROM viec_lam WHERE id=? AND nha_tuyen_dung_id=?");
    $chk->execute([$jobId, $ntdId]);
    $job = $chk->fetch();
    if (!$job) json_out(['success'=>false,'message'=>'Tin không hợp lệ']);

    $chk2 = $pdo->prepare("SELECT id FROM ung_tuyen WHERE viec_lam_id=? AND sinh_vien_id=?");
    $chk2->execute([$jobId, $svId]);
    if ($chk2->fetch()) json_out(['success'=>false,'message'=>'Đã có tương tác với SV này']);

    // ⚠️ QUAN TRỌNG: loai='loi_moi' + ngay_moi
    $pdo->prepare("INSERT INTO ung_tuyen
        (sinh_vien_id, viec_lam_id, loai, loi_nhan, trang_thai, ngay_moi)
        VALUES (?,?, 'loi_moi', ?, 'cho_duyet', NOW())")
        ->execute([$svId, $jobId, $message]);

    if (function_exists('save_sv_notification')) {
        save_sv_notification($pdo, $svId, '📬 Bạn có lời mời làm việc mới',
            'NTD đã mời bạn làm: ' . $job['tieu_de'] . '. Vào mục "Lời mời" để xem chi tiết.',
            'invitation');
    }

    json_out(['success'=>true,'message'=>'Đã gửi lời mời tới sinh viên']);
}