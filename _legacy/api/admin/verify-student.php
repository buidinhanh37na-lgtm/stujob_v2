<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH ============ */
if ($m === 'GET' && $action === 'requests') {
    $status = $_GET['status'] ?? 'cho_duyet';
    $search = trim($_GET['q'] ?? '');

    $sql = "SELECT yc.*, sv.ma_sinh_vien, sv.ho_ten, sv.email, sv.truong,
                   sv.chuyen_nganh, sv.nam_hoc, sv.anh_dai_dien,
                   a.ho_ten AS admin_name
            FROM yeu_cau_xac_thuc yc
            JOIN sinh_vien sv ON sv.id = yc.sinh_vien_id
            LEFT JOIN quan_tri_vien a ON a.id = yc.admin_id
            WHERE 1=1";
    $params = [];

    if ($status !== 'all') { $sql .= " AND yc.trang_thai=?"; $params[] = $status; }
    if ($search) {
        $sql .= " AND (sv.ma_sinh_vien LIKE ? OR sv.ho_ten LIKE ? OR sv.email LIKE ?)";
        $like = "%$search%";
        array_push($params, $like, $like, $like);
    }
    $sql .= " ORDER BY yc.created_at DESC LIMIT 200";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    json_out(['success'=>true, 'items'=>$st->fetchAll()]);
}

/* ============ CHI TIẾT ============ */
if ($m === 'GET' && $action === 'detail') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    $st = $pdo->prepare("SELECT yc.*, sv.ma_sinh_vien, sv.ho_ten, sv.email, sv.truong,
        sv.chuyen_nganh, sv.nam_hoc, sv.lop
        FROM yeu_cau_xac_thuc yc
        JOIN sinh_vien sv ON sv.id = yc.sinh_vien_id
        WHERE yc.id = ?");
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) json_out(['success'=>false,'message'=>'Không tìm thấy']);

    $mt = $pdo->prepare("SELECT * FROM sv_truong WHERE ma_sinh_vien = ?");
    $mt->execute([$row['ma_sinh_vien']]);
    $truong = $mt->fetch();

    $compare = null;
    if ($truong) {
        $compare = [
            'ho_ten' => ['he_thong'=>$row['ho_ten'], 'nha_truong'=>$truong['ho_ten'],
                'khop'=>mb_strtolower(trim($row['ho_ten'])) === mb_strtolower(trim($truong['ho_ten']))],
            'chuyen_nganh' => ['he_thong'=>$row['chuyen_nganh'], 'nha_truong'=>$truong['chuyen_nganh'],
                'khop'=>mb_strtolower(trim($row['chuyen_nganh'] ?? '')) === mb_strtolower(trim($truong['chuyen_nganh'] ?? ''))],
            'nam_hoc' => ['he_thong'=>$row['nam_hoc'], 'nha_truong'=>$truong['nam_hoc'],
                'khop'=>(int)$row['nam_hoc'] === (int)$truong['nam_hoc']],
            'trang_thai_truong' => $truong['trang_thai']
        ];
    }
    json_out(['success'=>true, 'yeu_cau'=>$row, 'nha_truong'=>$truong, 'so_khop'=>$compare]);
}

/* ============ TỰ ĐỘNG XÁC THỰC HÀNG LOẠT ============ */
if ($m === 'POST' && $action === 'auto-verify') {
    $st = $pdo->query("SELECT yc.id, yc.sinh_vien_id, sv.ma_sinh_vien
        FROM yeu_cau_xac_thuc yc
        JOIN sinh_vien sv ON sv.id = yc.sinh_vien_id
        WHERE yc.trang_thai='cho_duyet'");
    $requests = $st->fetchAll();

    $success = 0; $failed = 0; $details = [];
    foreach ($requests as $r) {
        $chk = $pdo->prepare("SELECT ho_ten, trang_thai FROM sv_truong WHERE ma_sinh_vien=?");
        $chk->execute([$r['ma_sinh_vien']]);
        $truong = $chk->fetch();

        if ($truong && $truong['trang_thai'] === 'dang_hoc') {
            $pdo->prepare("UPDATE yeu_cau_xac_thuc SET trang_thai='da_xac_thuc',
                admin_id=?, processed_at=NOW(), ghi_chu=? WHERE id=?")
                ->execute([$admin, "Tự động xác thực", $r['id']]);
            $pdo->prepare("UPDATE sinh_vien SET trang_thai_xac_thuc='da_xac_thuc' WHERE id=?")
                ->execute([$r['sinh_vien_id']]);

            if (function_exists('save_sv_notification')) {
                save_sv_notification($pdo, $r['sinh_vien_id'],
                    'Xác thực thành công', 'Tài khoản của bạn đã được xác thực.', 'success');
            }
            $success++;
        } else {
            $failed++;
        }
    }
    log_admin($pdo, $admin, 'auto_verify_batch', null, null,
        "Duyệt tự động: $success thành công, $failed thất bại");
    json_out(['success'=>true,
        'message'=>"Đã xử lý ".count($requests)." yêu cầu. Thành công: $success, Thất bại: $failed"]);
}

/* ============ DUYỆT 1 ============ */
if ($m === 'POST' && $action === 'approve') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    $note = trim($d['ghi_chu'] ?? '');
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    $st = $pdo->prepare("SELECT * FROM yeu_cau_xac_thuc WHERE id=?");
    $st->execute([$id]);
    $yc = $st->fetch();
    if (!$yc) json_out(['success'=>false,'message'=>'Không tìm thấy']);

    $pdo->prepare("UPDATE yeu_cau_xac_thuc SET trang_thai='da_xac_thuc',
        admin_id=?, processed_at=NOW(), ghi_chu=? WHERE id=?")
        ->execute([$admin, $note, $id]);
    $pdo->prepare("UPDATE sinh_vien SET trang_thai_xac_thuc='da_xac_thuc' WHERE id=?")
        ->execute([$yc['sinh_vien_id']]);

    if (function_exists('save_sv_notification')) {
        save_sv_notification($pdo, $yc['sinh_vien_id'], 'Xác thực thành công',
            'Tài khoản sinh viên của bạn đã được xác thực.', 'success');
    }
    log_admin($pdo, $admin, 'approve_verify', 'sinh_vien', $yc['sinh_vien_id'], $note);
    json_out(['success'=>true,'message'=>'Đã xác thực sinh viên']);
}

/* ============ TỪ CHỐI ============ */
if ($m === 'POST' && $action === 'reject') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    $reason = trim($d['ly_do'] ?? '');
    if (!$id || !$reason) json_out(['success'=>false,'message'=>'Thiếu thông tin']);

    $st = $pdo->prepare("SELECT * FROM yeu_cau_xac_thuc WHERE id=?");
    $st->execute([$id]);
    $yc = $st->fetch();
    if (!$yc) json_out(['success'=>false,'message'=>'Không tìm thấy']);

    $pdo->prepare("UPDATE yeu_cau_xac_thuc SET trang_thai='tu_choi',
        admin_id=?, processed_at=NOW(), ly_do_tu_choi=? WHERE id=?")
        ->execute([$admin, $reason, $id]);

    if (function_exists('save_sv_notification')) {
        save_sv_notification($pdo, $yc['sinh_vien_id'], 'Xác thực bị từ chối',
            "Lý do: $reason", 'error');
    }
    log_admin($pdo, $admin, 'reject_verify', 'sinh_vien', $yc['sinh_vien_id'], $reason);
    json_out(['success'=>true,'message'=>'Đã từ chối']);
}

/* ============ STATS ============ */
if ($m === 'GET' && $action === 'stats') {
    $st = $pdo->query("SELECT
        SUM(CASE WHEN trang_thai='cho_duyet' THEN 1 ELSE 0 END) AS cho_duyet,
        SUM(CASE WHEN trang_thai='da_xac_thuc' THEN 1 ELSE 0 END) AS da_xac_thuc,
        SUM(CASE WHEN trang_thai='tu_choi' THEN 1 ELSE 0 END) AS tu_choi,
        COUNT(*) AS tong
        FROM yeu_cau_xac_thuc");
    json_out(['success'=>true, 'yeu_cau'=>$st->fetch()]);
}