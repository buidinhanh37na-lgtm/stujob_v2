<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
require_employer();

$action = $_GET['action'] ?? '';

if ($action === 'categories') {
    $st = $pdo->query("SELECT * FROM nhom_viec ORDER BY id");
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($action === 'templates') {
    $catId = (int)($_GET['nhom_viec_id'] ?? 0);
    if (!$catId) json_out(['success'=>false,'message'=>'Thiếu nhóm việc']);
    $st = $pdo->prepare("SELECT * FROM mau_tin_viec WHERE nhom_viec_id=? ORDER BY id");
    $st->execute([$catId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

json_out(['success'=>false]);