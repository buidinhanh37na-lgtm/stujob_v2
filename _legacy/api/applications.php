<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT ut.*, v.tieu_de, n.ten_cong_ty FROM ung_tuyen ut
                        JOIN viec_lam v ON v.id=ut.viec_lam_id
                        JOIN nha_tuyen_dung n ON n.id=v.nha_tuyen_dung_id
                        WHERE ut.sinh_vien_id=? ORDER BY ut.created_at DESC");
    $st->execute([$svId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($m === 'POST') {
    $d = body();
    $vid = (int)($d['viec_lam_id'] ?? 0);
    if (!$vid) json_out(['success'=>false,'message'=>'Thiếu việc làm']);
    try {
        $pdo->prepare("INSERT INTO ung_tuyen (sinh_vien_id,viec_lam_id,loi_nhan) VALUES (?,?,?)")
            ->execute([$svId,$vid,$d['loi_nhan'] ?? '']);
        // Tạo thông báo
        $pdo->prepare("INSERT INTO thong_bao (sinh_vien_id,tieu_de,noi_dung,loai) VALUES (?,?,?,?)")
            ->execute([$svId,'Ứng tuyển thành công','Bạn đã ứng tuyển thành công. Vui lòng chờ phản hồi từ nhà tuyển dụng.','success']);
        json_out(['success'=>true,'message'=>'Đã gửi ứng tuyển']);
    } catch (Exception $e) {
        json_out(['success'=>false,'message'=>'Bạn đã ứng tuyển công việc này rồi']);
    }
}