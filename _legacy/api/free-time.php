<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    // Lịch rảnh = 6h–23h mỗi ngày (T2-CN) trừ các slot có lịch học
    $st = $pdo->prepare("SELECT * FROM lich_ranh WHERE sinh_vien_id=? ORDER BY thu, gio_bat_dau");
    $st->execute([$svId]);
    $manual = $st->fetchAll();

    $lh = $pdo->prepare("SELECT * FROM lich_hoc WHERE sinh_vien_id=? ORDER BY thu, gio_bat_dau");
    $lh->execute([$svId]);
    $lichHoc = $lh->fetchAll();

    // Tự động đề xuất: lịch rảnh từ 6h -> 23h, trừ lịch học
    $free = [];
    for ($t=2; $t<=8; $t++) {
        $busy = [];
        foreach ($lichHoc as $h) {
            if ((int)$h['thu'] === $t) {
                $busy[] = [$h['gio_bat_dau'], $h['gio_ket_thuc']];
            }
        }
        usort($busy, fn($a,$b)=>strcmp($a[0],$b[0]));
        $cur = '06:00:00';
        foreach ($busy as $b) {
            if ($b[0] > $cur) $free[] = ['thu'=>$t,'gio_bat_dau'=>$cur,'gio_ket_thuc'=>$b[0],'tu_dong'=>1];
            if ($b[1] > $cur) $cur = $b[1];
        }
        if ($cur < '23:00:00') $free[] = ['thu'=>$t,'gio_bat_dau'=>$cur,'gio_ket_thuc'=>'23:00:00','tu_dong'=>1];
    }

    json_out(['success'=>true,'tu_dong'=>$free,'thu_cong'=>$manual]);
}

if ($m === 'POST') {
    $d = body();
    $pdo->prepare("INSERT INTO lich_ranh (sinh_vien_id,thu,gio_bat_dau,gio_ket_thuc) VALUES (?,?,?,?)")
        ->execute([$svId,$d['thu'],$d['gio_bat_dau'],$d['gio_ket_thuc']]);
    json_out(['success'=>true]);
}

if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $pdo->prepare("DELETE FROM lich_ranh WHERE id=? AND sinh_vien_id=?")->execute([$id,$svId]);
    json_out(['success'=>true]);
}