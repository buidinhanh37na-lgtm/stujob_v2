<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH NGƯỜI DÙNG ============ */
if ($m === 'GET' && $action !== 'detail' && $action !== 'stats') {
    $type = $_GET['type'] ?? 'sinh_vien';
    $search = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    if ($type === 'sinh_vien') {
        $sql = "SELECT id, ma_sinh_vien AS code, ho_ten AS name, email,
                truong AS extra, trang_thai_xac_thuc AS verified,
                diem_danh_gia, so_lan_danh_gia, created_at
                FROM sinh_vien WHERE 1=1";
        $params = [];
        if ($search) {
            $sql .= " AND (ma_sinh_vien LIKE ? OR ho_ten LIKE ? OR email LIKE ?)";
            $like = "%$search%";
            array_push($params, $like, $like, $like);
        }
        $sql .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
    } else {
        $sql = "SELECT id, ten_cong_ty AS name, email, loai AS extra,
                trang_thai_xac_thuc AS verified,
                so_du AS diem_danh_gia, so_tin_da_dang AS so_lan_danh_gia,
                created_at
                FROM nha_tuyen_dung WHERE 1=1";
        $params = [];
        if ($search) {
            $sql .= " AND (ten_cong_ty LIKE ? OR email LIKE ?)";
            $like = "%$search%";
            array_push($params, $like, $like);
        }
        $sql .= " ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
    }

    $st = $pdo->prepare($sql);
    $st->execute($params);
    json_out(['success'=>true, 'items'=>$st->fetchAll(), 'type'=>$type, 'page'=>$page]);
}

/* ============ CHI TIẾT ============ */
if ($m === 'GET' && $action === 'detail') {
    $type = $_GET['type'] ?? 'sinh_vien';
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    if ($type === 'sinh_vien') {
        $st = $pdo->prepare("SELECT * FROM sinh_vien WHERE id=?");
        $st->execute([$id]);
        $user = $st->fetch();
        if ($user) unset($user['mat_khau']);

        if ($user) {
            $kn = $pdo->prepare("SELECT * FROM ky_nang WHERE sinh_vien_id=?");
            $kn->execute([$id]);
            $user['ky_nang'] = $kn->fetchAll();

            $cc = $pdo->prepare("SELECT * FROM chung_chi WHERE sinh_vien_id=?");
            $cc->execute([$id]);
            $user['chung_chi'] = $cc->fetchAll();

            $stat = $pdo->prepare("SELECT
                (SELECT COUNT(*) FROM ung_tuyen WHERE sinh_vien_id=?) AS so_ung_tuyen,
                (SELECT COUNT(*) FROM nhiem_vu WHERE sinh_vien_id=? AND trang_thai='hoan_thanh') AS so_viec_hoan_thanh,
                (SELECT IFNULL(SUM(so_tien),0) FROM giao_dich WHERE sinh_vien_id=? AND loai='thu_nhap') AS tong_thu_nhap");
            $stat->execute([$id, $id, $id]);
            $user['thong_ke'] = $stat->fetch();
        }
    } else {
        $st = $pdo->prepare("SELECT * FROM nha_tuyen_dung WHERE id=?");
        $st->execute([$id]);
        $user = $st->fetch();
        if ($user) unset($user['mat_khau']);

        if ($user) {
            $stat = $pdo->prepare("SELECT
                (SELECT COUNT(*) FROM viec_lam WHERE nha_tuyen_dung_id=?) AS so_tin_viec,
                (SELECT IFNULL(SUM(so_tien),0) FROM bao_dam_thanh_toan WHERE nha_tuyen_dung_id=? AND trang_thai='da_giai_ngan') AS tong_da_tra");
            $stat->execute([$id, $id]);
            $user['thong_ke'] = $stat->fetch();
        }
    }

    if (!$user) json_out(['success'=>false,'message'=>'Không tìm thấy']);
    json_out(['success'=>true, 'user'=>$user, 'type'=>$type]);
}

/* ============ KHÓA / MỞ KHÓA ============ */
if ($m === 'POST' && $action === 'toggle-status') {
    $d = body();
    $type = $d['type'] ?? 'sinh_vien';
    $id = (int)($d['id'] ?? 0);
    $reason = trim($d['ly_do'] ?? '');
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    if ($type === 'sinh_vien') {
        $colExists = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='sinh_vien' AND COLUMN_NAME='bi_khoa'")->fetchColumn();
        if (!$colExists) $pdo->exec("ALTER TABLE sinh_vien ADD COLUMN bi_khoa TINYINT DEFAULT 0");

        $st = $pdo->prepare("SELECT bi_khoa FROM sinh_vien WHERE id=?");
        $st->execute([$id]);
        $current = (int)$st->fetchColumn();
        $newStatus = $current ? 0 : 1;
        $pdo->prepare("UPDATE sinh_vien SET bi_khoa=? WHERE id=?")->execute([$newStatus, $id]);
        $msg = $newStatus ? 'Đã khóa tài khoản SV' : 'Đã mở khóa tài khoản SV';
    } else {
        $colExists = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='nha_tuyen_dung' AND COLUMN_NAME='bi_khoa'")->fetchColumn();
        if (!$colExists) $pdo->exec("ALTER TABLE nha_tuyen_dung ADD COLUMN bi_khoa TINYINT DEFAULT 0");

        $st = $pdo->prepare("SELECT bi_khoa FROM nha_tuyen_dung WHERE id=?");
        $st->execute([$id]);
        $current = (int)$st->fetchColumn();
        $newStatus = $current ? 0 : 1;
        $pdo->prepare("UPDATE nha_tuyen_dung SET bi_khoa=? WHERE id=?")->execute([$newStatus, $id]);
        $msg = $newStatus ? 'Đã khóa tài khoản NTD' : 'Đã mở khóa tài khoản NTD';
    }

    log_admin($pdo, $admin, $newStatus ? 'lock_user' : 'unlock_user', $type, $id, $reason);
    json_out(['success'=>true, 'message'=>$msg, 'bi_khoa'=>$newStatus]);
}

/* ============ THỐNG KÊ ============ */
if ($m === 'GET' && $action === 'stats') {
    $sv = (int)$pdo->query("SELECT COUNT(*) FROM sinh_vien")->fetchColumn();
    $svVerified = (int)$pdo->query("SELECT COUNT(*) FROM sinh_vien WHERE trang_thai_xac_thuc='da_xac_thuc'")->fetchColumn();
    $ntd = (int)$pdo->query("SELECT COUNT(*) FROM nha_tuyen_dung")->fetchColumn();
    $ntdVerified = (int)$pdo->query("SELECT COUNT(*) FROM nha_tuyen_dung WHERE trang_thai_xac_thuc='da_xac_thuc'")->fetchColumn();

    $svLocked = 0; $ntdLocked = 0;
    try { $svLocked = (int)$pdo->query("SELECT COUNT(*) FROM sinh_vien WHERE bi_khoa=1")->fetchColumn(); } catch (Exception $e) {}
    try { $ntdLocked = (int)$pdo->query("SELECT COUNT(*) FROM nha_tuyen_dung WHERE bi_khoa=1")->fetchColumn(); } catch (Exception $e) {}

    json_out([
        'success'=>true,
        'sinh_vien'=>[
            'tong'=>$sv,
            'da_xac_thuc'=>$svVerified,
            'chua_xac_thuc'=>max(0, $sv - $svVerified),
            'bi_khoa'=>$svLocked
        ],
        'nha_tuyen_dung'=>[
            'tong'=>$ntd,
            'da_xac_thuc'=>$ntdVerified,
            'chua_xac_thuc'=>max(0, $ntd - $ntdVerified),
            'bi_khoa'=>$ntdLocked
        ]
    ]);
}