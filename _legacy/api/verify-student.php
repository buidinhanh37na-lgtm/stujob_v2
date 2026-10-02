<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$d = body();

// Client gửi lên text OCR đã parse
$ma_the   = trim($d['ma_sinh_vien_the'] ?? '');
$ho_ten   = trim($d['ho_ten_the'] ?? '');
$truong   = trim($d['truong_the'] ?? '');

if (!$ma_the) json_out(['success'=>false,'message'=>'Thiếu MSSV từ thẻ']);

// Lấy MSSV đã đăng ký
$st = $pdo->prepare("SELECT ma_sinh_vien FROM sinh_vien WHERE id=?");
$st->execute([$svId]);
$sv = $st->fetch();

// So khớp: MSSV trên thẻ phải trùng với MSSV tài khoản
if (strtoupper(trim($sv['ma_sinh_vien'])) !== strtoupper($ma_the)) {
    json_out([
        'success'=>false,
        'message'=>"MSSV trên thẻ ($ma_the) không khớp với tài khoản (".$sv['ma_sinh_vien'].")",
        'match'=>false
    ]);
}

// Đánh dấu đã xác thực
$pdo->prepare("UPDATE sinh_vien SET trang_thai_xac_thuc='da_xac_thuc' WHERE id=?")->execute([$svId]);

// Thông báo
$pdo->prepare("INSERT INTO thong_bao (sinh_vien_id,tieu_de,noi_dung,loai) VALUES (?,?,?,?)")
    ->execute([$svId,'Định danh thành công','Thẻ sinh viên của bạn đã được xác thực.','success']);

json_out(['success'=>true,'message'=>'Định danh thành công!','match'=>true]);