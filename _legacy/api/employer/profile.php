<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT id,ten_cong_ty,email,loai,cccd,ma_so_thue,ma_so_hkd,
                         nguoi_dai_dien,so_dien_thoai,dia_chi,vi_do,kinh_do,website,
                         linh_vuc,mo_ta,logo,trang_thai_xac_thuc,so_du,so_tin_da_dang
                         FROM nha_tuyen_dung WHERE id=?");
    $st->execute([$ntdId]);
    json_out(['success' => true, 'nha_tuyen_dung' => $st->fetch()]);
}

if ($m === 'POST') {
    // Cập nhật hồ sơ
    if (!empty($_FILES['logo']['name'])) {
        $dir = __DIR__ . '/../../uploads/avatars/';
        if (!is_dir($dir))
            mkdir($dir, 0777, true);
        $ext = strtolower(pathinfo($_FILES['logo']['name'], PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
            $fn = 'ntd_' . $ntdId . '_' . time() . '.' . $ext;
            move_uploaded_file($_FILES['logo']['tmp_name'], $dir . $fn);
            $pdo->prepare("UPDATE nha_tuyen_dung SET logo=? WHERE id=?")
                ->execute(['uploads/avatars/' . $fn, $ntdId]);
        }
    }

    // Content-Type: có thể là multipart hoặc JSON
    $src = !empty($_POST) ? $_POST : body();
    if (empty($src))
        json_out(['success' => false, 'message' => 'Không có dữ liệu']);

    // Chỉ cho phép update các field KHÔNG khóa
    $fields = [
        'ten_cong_ty',
        'nguoi_dai_dien',
        'so_dien_thoai',
        'dia_chi',
        'linh_vuc',
        'mo_ta',
        'website',
        'vi_do',
        'kinh_do'
    ];
    // ❌ KHÔNG update: email, cccd, ma_so_thue, ma_so_hkd
    $set = [];
    $vals = [];
    foreach ($fields as $f) {
        if (isset($src[$f])) {
            $set[] = "$f=?";
            $vals[] = $src[$f];
        }
    }
    if ($set) {
        $vals[] = $ntdId;
        $pdo->prepare("UPDATE nha_tuyen_dung SET " . implode(',', $set) . " WHERE id=?")->execute($vals);
    }
    json_out(['success' => true, 'message' => 'Cập nhật thành công']);
}

if ($m === 'PUT') {
    // Xác thực định danh
    $d = body();
    $st = $pdo->prepare("SELECT loai, cccd, ma_so_thue, ma_so_hkd FROM nha_tuyen_dung WHERE id=?");
    $st->execute([$ntdId]);
    $ntd = $st->fetch();

    $match = false;
    if ($ntd['loai'] === 'ca_nhan' && !empty($d['cccd']))
        $match = trim($ntd['cccd']) === trim($d['cccd']);
    elseif ($ntd['loai'] === 'ho_kinh_doanh' && !empty($d['ma_so_hkd']))
        $match = trim($ntd['ma_so_hkd']) === trim($d['ma_so_hkd']);
    elseif ($ntd['loai'] === 'doanh_nghiep' && !empty($d['ma_so_thue']))
        $match = trim($ntd['ma_so_thue']) === trim($d['ma_so_thue']);

    if ($match) {
        $pdo->prepare("UPDATE nha_tuyen_dung SET trang_thai_xac_thuc='da_xac_thuc' WHERE id=?")
            ->execute([$ntdId]);
        json_out(['success' => true, 'message' => 'Xác thực thành công', 'match' => true]);
    }
    json_out(['success' => false, 'message' => 'Thông tin không khớp', 'match' => false]);
}