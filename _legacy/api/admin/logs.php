<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH NHẬT KÝ ============ */
if ($m === 'GET' && $action === 'list') {
    $adminFilter = (int)($_GET['admin_id'] ?? 0);
    $actionFilter = trim($_GET['action'] ?? '');
    $search = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 30;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT nk.*, a.ho_ten AS admin_name, a.vai_tro AS admin_role
            FROM nhat_ky_admin nk
            JOIN quan_tri_vien a ON a.id = nk.admin_id
            WHERE 1=1";
    $params = [];

    if ($adminFilter) { $sql .= " AND nk.admin_id=?"; $params[] = $adminFilter; }
    if ($actionFilter) { $sql .= " AND nk.hanh_dong=?"; $params[] = $actionFilter; }
    if ($search) {
        $sql .= " AND (nk.chi_tiet LIKE ? OR nk.hanh_dong LIKE ? OR a.ho_ten LIKE ?)";
        $like = "%$search%";
        array_push($params, $like, $like, $like);
    }

    $sql .= " ORDER BY nk.created_at DESC LIMIT $limit OFFSET $offset";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $items = $st->fetchAll();

    // Đếm tổng
    $countSql = "SELECT COUNT(*) FROM nhat_ky_admin nk
        JOIN quan_tri_vien a ON a.id = nk.admin_id WHERE 1=1";
    // Note: xây lại điều kiện count
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM nhat_ky_admin nk
        JOIN quan_tri_vien a ON a.id = nk.admin_id
        WHERE 1=1"
        . ($adminFilter ? " AND nk.admin_id=" . $adminFilter : "")
        . ($actionFilter ? " AND nk.hanh_dong='" . addslashes($actionFilter) . "'" : "")
    );
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    json_out([
        'success'=>true,
        'items'=>$items,
        'total'=>$total,
        'page'=>$page,
        'total_pages'=>ceil($total / $limit)
    ]);
}

/* ============ DANH SÁCH ADMIN ============ */
if ($m === 'GET' && $action === 'admins') {
    $st = $pdo->query("SELECT id, ho_ten, vai_tro FROM quan_tri_vien ORDER BY ho_ten");
    json_out(['success'=>true, 'items'=>$st->fetchAll()]);
}

/* ============ DANH SÁCH LOẠI HÀNH ĐỘNG ============ */
if ($m === 'GET' && $action === 'actions') {
    $st = $pdo->query("SELECT DISTINCT hanh_dong FROM nhat_ky_admin ORDER BY hanh_dong");
    json_out(['success'=>true, 'items'=>$st->fetchAll(PDO::FETCH_COLUMN)]);
}

/* ============ THỐNG KÊ ============ */
if ($m === 'GET' && $action === 'stats') {
    $today = date('Y-m-d');
    $total = (int)$pdo->query("SELECT COUNT(*) FROM nhat_ky_admin")->fetchColumn();

    $st = $pdo->prepare("SELECT COUNT(*) FROM nhat_ky_admin WHERE DATE(created_at)=?");
    $st->execute([$today]);
    $todayVal = (int)$st->fetchColumn();

    $top = $pdo->query("SELECT a.ho_ten, COUNT(nk.id) AS so_lan
        FROM nhat_ky_admin nk
        JOIN quan_tri_vien a ON a.id = nk.admin_id
        GROUP BY a.id ORDER BY so_lan DESC LIMIT 5")->fetchAll();

    $topAction = $pdo->query("SELECT hanh_dong, COUNT(*) AS so_lan
        FROM nhat_ky_admin
        GROUP BY hanh_dong ORDER BY so_lan DESC LIMIT 5")->fetchAll();

    json_out([
        'success'=>true,
        'tong'=>$total,
        'hom_nay'=>$todayVal,
        'top_admin'=>$top,
        'top_action'=>$topAction
    ]);
}

/* ============ XÓA LOG CŨ ============ */
if ($m === 'DELETE' && $action === 'clean-old') {
    $admin = require_role($pdo, ['super_admin','admin']);
    $days = (int)($_GET['days'] ?? 90);

    $st = $pdo->prepare("DELETE FROM nhat_ky_admin WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
    $st->execute([$days]);
    $deleted = $st->rowCount();

    log_admin($pdo, $admin['id'], 'clean_logs', null, null, "Xóa $deleted bản ghi cũ");
    json_out(['success'=>true, 'message'=>"Đã xóa $deleted bản ghi"]);
}