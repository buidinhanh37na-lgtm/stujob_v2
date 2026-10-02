<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $st = $pdo->prepare("SELECT * FROM chung_chi WHERE sinh_vien_id=? ORDER BY id DESC");
    $st->execute([$svId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Upload file
    if (!isset($_FILES['file'])) json_out(['success'=>false,'message'=>'Thiếu file']);

    $ten    = trim($_POST['ten_chung_chi'] ?? '');
    $toChuc = trim($_POST['to_chuc'] ?? '');
    $ngay   = $_POST['ngay_cap'] ?? null;

    if (!$ten) json_out(['success'=>false,'message'=>'Vui lòng nhập tên chứng chỉ']);

    $dir = __DIR__ . '/../uploads/';
    if (!is_dir($dir)) mkdir($dir, 0777, true);
    $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
    $allow = ['jpg','jpeg','png','pdf','webp'];
    if (!in_array($ext, $allow)) json_out(['success'=>false,'message'=>'Chỉ cho phép ảnh/PDF']);
    if ($_FILES['file']['size'] > 10*1024*1024) json_out(['success'=>false,'message'=>'File tối đa 10MB']);

    $fn = 'cc_' . $svId . '_' . time() . '.' . $ext;
    move_uploaded_file($_FILES['file']['tmp_name'], $dir . $fn);
    $url = 'uploads/' . $fn;

    $pdo->prepare("INSERT INTO chung_chi (sinh_vien_id,ten_chung_chi,to_chuc,ngay_cap,file_url) VALUES (?,?,?,?,?)")
        ->execute([$svId,$ten,$toChuc,$ngay ?: null,$url]);
    json_out(['success'=>true,'message'=>'Đã tải lên chứng chỉ']);
}

if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $pdo->prepare("DELETE FROM chung_chi WHERE id=? AND sinh_vien_id=?")->execute([$id,$svId]);
    json_out(['success'=>true]);
}