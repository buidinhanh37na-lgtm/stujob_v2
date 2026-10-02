<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT * FROM thong_bao_ntd WHERE nha_tuyen_dung_id=?
        ORDER BY ngay_tao DESC LIMIT 50");
    $st->execute([$ntdId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($m === 'PUT') {
    $pdo->prepare("UPDATE thong_bao_ntd SET da_doc=1 WHERE nha_tuyen_dung_id=?")
        ->execute([$ntdId]);
    json_out(['success'=>true]);
}