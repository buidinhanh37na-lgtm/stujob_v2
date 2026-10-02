<?php
require_once __DIR__ . '/_helpers-admin.php';
$adminId = require_admin();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT * FROM thong_bao_admin
        WHERE admin_id=? OR admin_id IS NULL
        ORDER BY created_at DESC LIMIT 50");
    $st->execute([$adminId]);
    $items = $st->fetchAll();
    $unread = 0;
    foreach ($items as $it) if (!$it['da_doc']) $unread++;
    json_out(['success'=>true, 'items'=>$items, 'unread'=>$unread]);
}

if ($m === 'PUT') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if ($id) {
        $pdo->prepare("UPDATE thong_bao_admin SET da_doc=1 WHERE id=?")->execute([$id]);
    } else {
        $pdo->prepare("UPDATE thong_bao_admin SET da_doc=1
            WHERE (admin_id=? OR admin_id IS NULL) AND da_doc=0")->execute([$adminId]);
    }
    json_out(['success'=>true]);
}

if ($m === 'POST') {
    $admin = require_role($pdo, ['super_admin','admin']);
    $d = body();
    $title = trim($d['tieu_de'] ?? '');
    $content = trim($d['noi_dung'] ?? '');
    $targetAdmin = !empty($d['admin_id']) ? (int)$d['admin_id'] : null;

    if (!$title) json_out(['success'=>false,'message'=>'Thiếu tiêu đề']);

    notify_admin($pdo, $targetAdmin, $title, $content, $d['loai'] ?? 'info');
    log_admin($pdo, $admin['id'], 'send_notification', 'admin', $targetAdmin, $title);
    json_out(['success'=>true, 'message'=>'Đã gửi thông báo']);
}