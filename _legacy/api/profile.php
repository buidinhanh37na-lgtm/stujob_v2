<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $sv = $pdo->prepare("SELECT id,ma_sinh_vien,ho_ten,email,so_dien_thoai,truong,khoa,chuyen_nganh,nam_hoc,gpa,mo_ta,anh_dai_dien,trang_thai_xac_thuc FROM sinh_vien WHERE id=?");
    $sv->execute([$svId]);
    $kn = $pdo->prepare("SELECT * FROM ky_nang WHERE sinh_vien_id=? ORDER BY id DESC");
    $kn->execute([$svId]);
    json_out(['success'=>true,'sinh_vien'=>$sv->fetch(),'ky_nang'=>$kn->fetchAll()]);
}

if ($m === 'POST') {
    $d = body();
    $fields = ['ho_ten','so_dien_thoai','truong','khoa','chuyen_nganh','nam_hoc','gpa','mo_ta'];
    $set = []; $vals = [];
    foreach ($fields as $f) {
        if (isset($d[$f])) { $set[] = "$f=?"; $vals[] = $d[$f]; }
    }
    if ($set) {
        $vals[] = $svId;
        $pdo->prepare("UPDATE sinh_vien SET ".implode(',', $set)." WHERE id=?")->execute($vals);
    }

    // Cập nhật kỹ năng (nếu client gửi mảng ky_nang)
    if (isset($d['ky_nang']) && is_array($d['ky_nang'])) {
        $pdo->prepare("DELETE FROM ky_nang WHERE sinh_vien_id=?")->execute([$svId]);
        $ins = $pdo->prepare("INSERT INTO ky_nang (sinh_vien_id,ten_ky_nang,muc_do) VALUES (?,?,?)");
        foreach ($d['ky_nang'] as $k) {
            if (!empty($k['ten_ky_nang'])) {
                $ins->execute([$svId, $k['ten_ky_nang'], $k['muc_do'] ?? 'trung_binh']);
            }
        }
    }
    json_out(['success'=>true,'message'=>'Cập nhật thành công']);
}