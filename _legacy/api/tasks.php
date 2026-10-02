<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT nv.*, v.tieu_de AS ten_viec FROM nhiem_vu nv
                        LEFT JOIN viec_lam v ON v.id=nv.viec_lam_id
                        WHERE nv.sinh_vien_id=? ORDER BY nv.created_at DESC");
    $st->execute([$svId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($m === 'POST' && ($_GET['action'] ?? '') === 'submit') {
    $id = (int)($_POST['id'] ?? 0);
    if (!$id || !isset($_FILES['file'])) 
        json_out(['success'=>false, 'message'=>'Thiếu dữ liệu']);

    // ✅ Chỉ nhận PDF/ảnh
    $ext = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
    $allowed = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

    if (!in_array($ext, $allowed)) {
        json_out([
            'success' => false,
            'message' => '❌ Chỉ chấp nhận file PDF hoặc ảnh (JPG, PNG, WEBP). 
                          Word/Excel/PPT vui lòng xuất ra PDF trước khi nộp.'
        ]);
    }

    // Giới hạn 20MB
    if ($_FILES['file']['size'] > 20 * 1024 * 1024) {
        json_out(['success'=>false, 'message'=>'File tối đa 20MB']);
    }

    // Upload
    $dir = __DIR__ . '/../uploads/submissions/';
    if (!is_dir($dir)) mkdir($dir, 0777, true);

    $fn = 'sp_' . $svId . '_' . time() . '.' . $ext;
    move_uploaded_file($_FILES['file']['tmp_name'], $dir . $fn);

    // Tạo preview (watermark ảnh / copy PDF)
    require_once __DIR__ . '/employer/_helpers-employer.php';
    $previewPath = create_preview_file($fn, $ext);

    // Lưu vào DB
    $pdo->prepare("UPDATE nhiem_vu 
        SET file_san_pham=?, file_xem_truoc=?, trang_thai='cho_duyet' 
        WHERE id=? AND sinh_vien_id=?")
        ->execute(['uploads/submissions/' . $fn, $previewPath, $id, $svId]);

    json_out(['success'=>true, 'message'=>'✅ Đã nộp bài thành công']);
}

if ($m === 'POST') {
    $d = body();
    $pdo->prepare("INSERT INTO nhiem_vu (sinh_vien_id,viec_lam_id,ten_nhiem_vu,mo_ta,han_nop) VALUES (?,?,?,?,?)")
        ->execute([$svId,$d['viec_lam_id'] ?? null,$d['ten_nhiem_vu'],$d['mo_ta'] ?? '',$d['han_nop'] ?? null]);
    json_out(['success'=>true,'message'=>'Đã thêm nhiệm vụ']);
}

if ($m === 'PUT') {
    $d = body();
    $pdo->prepare("UPDATE nhiem_vu SET trang_thai=? WHERE id=? AND sinh_vien_id=?")
        ->execute([$d['trang_thai'],$d['id'],$svId]);
    json_out(['success'=>true]);
}

if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    $pdo->prepare("DELETE FROM nhiem_vu WHERE id=? AND sinh_vien_id=?")->execute([$id,$svId]);
    json_out(['success'=>true]);
}