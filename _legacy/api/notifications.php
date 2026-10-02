<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT * FROM thong_bao WHERE sinh_vien_id=? ORDER BY created_at DESC LIMIT 50");
    $st->execute([$svId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}
if ($m === 'PUT') {
    $pdo->prepare("UPDATE thong_bao SET da_doc=1 WHERE sinh_vien_id=?")->execute([$svId]);
    json_out(['success'=>true]);
}