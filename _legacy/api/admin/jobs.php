<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($m === 'GET') {
    $status = $_GET['status'] ?? 'all';
    $search = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT v.*, n.ten_cong_ty,
            (SELECT COUNT(*) FROM ung_tuyen WHERE viec_lam_id=v.id) AS so_ung_tuyen,
            kd.hanh_dong AS kd_hanh_dong, kd.diem_rui_ro
            FROM viec_lam v
            JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
            LEFT JOIN kiem_duyet_tin kd ON kd.viec_lam_id = v.id
            WHERE 1=1";
    $params = [];

    if ($status !== 'all') { $sql .= " AND v.trang_thai=?"; $params[] = $status; }
    if ($search) {
        $sql .= " AND (v.tieu_de LIKE ? OR n.ten_cong_ty LIKE ?)";
        $like = "%$search%";
        array_push($params, $like, $like);
    }
    $sql .= " ORDER BY v.created_at DESC LIMIT $limit OFFSET $offset";
    $st = $pdo->prepare($sql);
    $st->execute($params);

    json_out(['success'=>true, 'items'=>$st->fetchAll(), 'page'=>$page]);
}

if ($m === 'POST' && $action === 'force-close') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    $reason = trim($d['ly_do'] ?? 'Admin đóng tin');
    $pdo->prepare("UPDATE viec_lam SET trang_thai='da_dong' WHERE id=?")->execute([$id]);
    log_admin($pdo, $admin, 'force_close_job', 'viec_lam', $id, $reason);
    json_out(['success'=>true,'message'=>'Đã đóng tin']);
}

if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);
    $pdo->prepare("DELETE FROM viec_lam WHERE id=?")->execute([$id]);
    log_admin($pdo, $admin, 'delete_job', 'viec_lam', $id);
    json_out(['success'=>true,'message'=>'Đã xóa tin']);
}