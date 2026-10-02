<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();

$d = body();
$title = trim($d['tieu_de'] ?? '');
$desc = $d['mo_ta'] ?? '';
$skills = $d['ky_nang_can'] ?? '';
$salary = (float)($d['thu_lao'] ?? 0);
$categoryId = (int)($d['nhom_viec_id'] ?? 0) ?: null;
$jobType = $d['loai_cong_viec'] ?? 'remote';
$quantity = (int)($d['so_luong_can'] ?? 1);
$sessions = (int)($d['so_buoi'] ?? 1);
$hours = (int)($d['gio_uoc_tinh'] ?? 0);
$workAddress = trim($d['dia_chi_lam_viec'] ?? '');

// 4 mốc thời gian
$deadline = !empty($d['han_chot']) ? $d['han_chot'] : null;
$startDate = !empty($d['ngay_bat_dau']) ? $d['ngay_bat_dau'] : null;
$endDate = !empty($d['ngay_ket_thuc']) ? $d['ngay_ket_thuc'] : null;
$hanNopFile = !empty($d['han_nop_file']) ? $d['han_nop_file'] : null;

if (!$title) json_out(['success'=>false,'message'=>'Vui lòng nhập tiêu đề']);
if ($salary <= 0) json_out(['success'=>false,'message'=>'Vui lòng nhập thù lao']);

// Validate theo loại
if ($jobType === 'remote') {
    if (!$deadline) 
        json_out(['success'=>false,'message'=>'Chọn hạn ứng tuyển']);
    if (!$hanNopFile) 
        json_out(['success'=>false,'message'=>'Chọn hạn nộp sản phẩm']);
    if ($hanNopFile < $deadline) 
        json_out(['success'=>false,'message'=>'Hạn nộp phải sau hạn ứng tuyển']);

    $startDate = $endDate = null;
    $workAddress = '';
} else {
    // onsite / hybrid
    if (!$deadline) 
        json_out(['success'=>false,'message'=>'Chọn hạn ứng tuyển']);
    if (!$startDate || !$endDate) 
        json_out(['success'=>false,'message'=>'Chọn ngày bắt đầu và kết thúc']);
    if (!$hanNopFile) 
        json_out(['success'=>false,'message'=>'Chọn hạn nộp sản phẩm']);

    if ($startDate > $endDate) 
        json_out(['success'=>false,'message'=>'Ngày kết thúc phải sau ngày bắt đầu']);
    if ($deadline > $startDate) 
        json_out(['success'=>false,'message'=>'Hạn ứng tuyển phải trước ngày bắt đầu làm']);
    if ($hanNopFile < $endDate) 
        json_out(['success'=>false,'message'=>'Hạn nộp phải sau ngày kết thúc']);
    if (!$workAddress) 
        json_out(['success'=>false,'message'=>'Nhập địa chỉ làm việc']);
}

// Đếm số tin đã đăng
$st = $pdo->prepare("SELECT so_tin_da_dang FROM nha_tuyen_dung WHERE id=?");
$st->execute([$ntdId]);
$postedCount = (int)$st->fetchColumn();

// Tính phí dịch vụ
$serviceFee = calc_service_fee($postedCount, $salary);

// INSERT
$ins = $pdo->prepare("INSERT INTO viec_lam
    (nha_tuyen_dung_id, nhom_viec_id, tieu_de, mo_ta, ky_nang_can,
     luong_min, luong_max, phi_dich_vu, don_vi_luong,
     loai_cong_viec, so_luong_can, so_buoi, gio_uoc_tinh, dia_chi_lam_viec,
     han_chot, ngay_bat_dau, ngay_ket_thuc, han_nop_file, trang_thai)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'dang_mo')");
$ins->execute([
    $ntdId, $categoryId, $title, $desc, $skills,
    $salary, $salary, $serviceFee, 'VNĐ',
    $jobType, $quantity, $sessions, $hours, $workAddress,
    $deadline, $startDate, $endDate, $hanNopFile
]);

// Tăng bộ đếm
$pdo->prepare("UPDATE nha_tuyen_dung SET so_tin_da_dang = so_tin_da_dang + 1 WHERE id=?")
    ->execute([$ntdId]);

$msg = 'Đã đăng tin';
if ($serviceFee > 0) $msg .= ' (Phí DV 10%: ' . number_format($serviceFee) . 'đ)';

json_out([
    'success'=>true,
    'message'=>$msg,
    'id'=>$pdo->lastInsertId(),
    'service_fee'=>$serviceFee
]);