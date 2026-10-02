<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT v.*, n.ten_nhom, n.icon,
        (SELECT COUNT(*) FROM ung_tuyen WHERE viec_lam_id=v.id) AS so_ung_tuyen
        FROM viec_lam v
        LEFT JOIN nhom_viec n ON n.id=v.nhom_viec_id
        WHERE v.nha_tuyen_dung_id=?
        ORDER BY v.created_at DESC");
    $st->execute([$ntdId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($m === 'PUT') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    $status = $d['trang_thai'] ?? '';
    if (!in_array($status, ['dang_mo', 'da_dong']))
        json_out(['success'=>false,'message'=>'Trạng thái không hợp lệ']);
    $pdo->prepare("UPDATE viec_lam SET trang_thai=? WHERE id=? AND nha_tuyen_dung_id=?")
        ->execute([$status, $id, $ntdId]);
    json_out(['success'=>true,'message'=>'Đã cập nhật']);
}

if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $pdo->prepare("DELETE FROM viec_lam WHERE id=? AND nha_tuyen_dung_id=?")->execute([$id, $ntdId]);
    json_out(['success'=>true,'message'=>'Đã xoá']);
}