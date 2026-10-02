<?php
/**
 * SEED ALL — Chạy 1 lần để tạo dữ liệu mẫu cho cả 3 module
 * Truy cập: http://localhost/stujob/config/seed-all.php
 */
require_once __DIR__ . '/database.php';
header('Content-Type: text/html; charset=utf-8');

echo "<h1>🌱 Seed All Modules</h1>";

$hash = password_hash('123456', PASSWORD_BCRYPT);

/* ============ 1. ADMIN MẪU ============ */
$adminPass = password_hash('admin123', PASSWORD_BCRYPT);
$pdo->prepare("INSERT IGNORE INTO quan_tri_vien (id, ho_ten, email, mat_khau, vai_tro, trang_thai)
    VALUES (1, 'Super Admin', 'admin@stujob.vn', ?, 'super_admin', 'hoat_dong')
    ON DUPLICATE KEY UPDATE mat_khau=VALUES(mat_khau)")->execute([$adminPass]);
echo "✅ Admin: admin@stujob.vn / admin123<br>";

/* ============ 2. NTD MẪU ============ */
$ntds = [
    [1, 'Công ty TNHH ABC Tech', 'hr@abctech.vn', 'doanh_nghiep', '0123456789', 'Nguyễn Văn A', '0912345678', 'Hà Nội', 'CNTT'],
    [2, 'Hộ KD Trà Sữa Mộc', 'contact@trasuamoc.vn', 'ho_kinh_doanh', '12A3456789', 'Trần Thị B', '0987654321', 'TP.HCM', 'F&B'],
    [3, 'Studio Sáng Tạo', 'designer@sangtao.vn', 'doanh_nghiep', '0987654321', 'Lê Văn C', '0976543210', 'Đà Nẵng', 'Thiết kế'],
];
$ins = $pdo->prepare("INSERT IGNORE INTO nha_tuyen_dung
    (id, ten_cong_ty, email, mat_khau, loai, ma_so_thue, nguoi_dai_dien, so_dien_thoai, dia_chi, linh_vuc, trang_thai_xac_thuc, so_du)
    VALUES (?,?,?,?,?,?,?,?,?,?, 'da_xac_thuc', 0)
    ON DUPLICATE KEY UPDATE mat_khau=VALUES(mat_khau)");
foreach ($ntds as $n) {
    $ins->execute([$n[0], $n[1], $n[2], $hash, $n[3], $n[4], $n[5], $n[6], $n[7], $n[8]]);
    $pdo->prepare("INSERT IGNORE INTO vi_ntd (nha_tuyen_dung_id, so_du) VALUES (?, 10000000)")
        ->execute([$n[0]]);
}
echo "✅ 3 NTD mẫu (pass: 123456)<br>";

/* ============ 3. SV MẪU ============ */
$svs = [
    [1, 'SV001', 'Nguyễn Văn A', 'sv1@stujob.vn', 'KTPM01', 'CNTT', 3.8, 'da_xac_thuc'],
    [2, 'SV002', 'Trần Thị B', 'sv2@stujob.vn', 'MKT02', 'Marketing', 3.5, 'da_xac_thuc'],
    [3, 'SV003', 'Lê Văn C', 'sv3@stujob.vn', 'TA01', 'Tiếng Anh', 3.9, 'chua'],
];
$ins = $pdo->prepare("INSERT IGNORE INTO sinh_vien
    (id, ma_sinh_vien, ho_ten, email, mat_khau, lop, chuyen_nganh, gpa, trang_thai_xac_thuc)
    VALUES (?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE mat_khau=VALUES(mat_khau)");
foreach ($svs as $s) {
    $ins->execute([$s[0], $s[1], $s[2], $s[3], $hash, $s[4], $s[5], $s[6], $s[7]]);
    $pdo->prepare("INSERT IGNORE INTO vi_tien (sinh_vien_id, so_du) VALUES (?, 0)")->execute([$s[0]]);
}
echo "✅ 3 SV mẫu (pass: 123456)<br>";

/* ============ 4. KỸ NĂNG ============ */
$pdo->exec("DELETE FROM ky_nang WHERE sinh_vien_id IN (1,2,3)");
$kn = $pdo->prepare("INSERT INTO ky_nang (sinh_vien_id, ten_ky_nang, muc_do) VALUES (?,?,?)");
foreach ([
    [1, 'HTML', 'gioi'], [1, 'CSS', 'gioi'], [1, 'JavaScript', 'kha'], [1, 'React', 'trung_binh'],
    [2, 'Content', 'gioi'], [2, 'SEO', 'kha'], [2, 'Facebook Ads', 'trung_binh'],
    [3, 'Tiếng Anh', 'xuat_sac'], [3, 'Giao tiếp', 'gioi'],
] as $k) $kn->execute($k);
echo "✅ 9 kỹ năng<br>";

/* ============ 5. TIN VIỆC MẪU ============ */
$pdo->exec("DELETE FROM viec_lam WHERE id IN (1,2,3,4)");
$ins = $pdo->prepare("INSERT INTO viec_lam
    (id, nha_tuyen_dung_id, nhom_viec_id, tieu_de, mo_ta, ky_nang_can,
     luong_min, luong_max, phi_dich_vu, loai_cong_viec, han_chot, trang_thai)
    VALUES (?,?,?,?,?,?,?,?,0,?,?, 'dang_mo')");
foreach ([
    [1, 1, 3, 'Thực tập sinh Frontend', 'Xây dựng giao diện web', 'HTML,CSS,JavaScript', 2000000, 4000000, 'remote', date('Y-m-d', strtotime('+30 days'))],
    [2, 1, 4, 'Designer Part-time', 'Thiết kế poster social', 'Photoshop,Illustrator', 1500000, 2500000, 'onsite', date('Y-m-d', strtotime('+30 days'))],
    [3, 2, 2, 'Nhân viên phục vụ', 'Phục vụ quán trà sữa', 'Giao tiếp', 800000, 1500000, 'onsite', date('Y-m-d', strtotime('+15 days'))],
    [4, 3, 5, 'Content Marketing', 'Viết bài blog', 'Content,SEO', 1500000, 3000000, 'hybrid', date('Y-m-d', strtotime('+20 days'))],
] as $v) $ins->execute($v);
echo "✅ 4 tin việc<br>";

/* ============ 6. SV TRƯỜNG ============ */
$ins = $pdo->prepare("INSERT IGNORE INTO sv_truong
    (ma_sinh_vien, ho_ten, khoa, chuyen_nganh, nam_hoc, lop, trang_thai)
    VALUES (?,?,?,?,?,?,?)");
foreach ([
    ['SV001', 'Nguyễn Văn A', 'CNTT', 'Công nghệ thông tin', 3, 'KTPM01', 'dang_hoc'],
    ['SV002', 'Trần Thị B', 'Kinh tế', 'Marketing', 4, 'MKT02', 'dang_hoc'],
    ['SV003', 'Lê Văn C', 'Ngoại ngữ', 'Tiếng Anh', 2, 'TA01', 'dang_hoc'],
    ['SV004', 'Phạm Thị D', 'CNTT', 'Khoa học dữ liệu', 4, 'KHDL01', 'dang_hoc'],
    ['SV005', 'Hoàng Văn E', 'Kinh tế', 'Kế toán', 4, 'KT01', 'tot_nghiep'],
] as $t) $ins->execute($t);
echo "✅ 5 SV nhà trường<br>";

/* ============ 7. KHIẾU NẠI MẪU ============ */
$ins = $pdo->prepare("INSERT IGNORE INTO khieu_nai
    (id, nguoi_gui_loai, nguoi_gui_id, doi_tuong_loai, doi_tuong_id, viec_lam_id,
     tieu_de, noi_dung, trang_thai, uu_tien)
    VALUES (?,?,?,?,?,?,?,?,?,?)");
$ins->execute([1, 'sinh_vien', 1, 'nha_tuyen_dung', 1, 1,
    'Chưa nhận được thù lao',
    'Đã hoàn thành công việc từ 3 ngày trước nhưng chưa được thanh toán.',
    'cho_xu_ly', 'cao']);
$ins->execute([2, 'nha_tuyen_dung', 1, 'sinh_vien', 2, 3,
    'Sinh viên không đúng giờ',
    'Sinh viên đi muộn 3 buổi liên tiếp, ảnh hưởng công việc.',
    'dang_xu_ly', 'trung_binh']);
echo "✅ 2 khiếu nại mẫu<br>";

echo "<hr><h2>🎉 Hoàn tất!</h2>";
echo "<h3>🔑 Tài khoản test:</h3>";
echo "<ul>";
echo "<li><b>Admin</b>: admin@stujob.vn / admin123</li>";
echo "<li><b>NTD</b>: hr@abctech.vn / 123456</li>";
echo "<li><b>SV</b>: sv1@stujob.vn / 123456</li>";
echo "</ul>";
echo "<h3>🔗 Truy cập:</h3>";
echo "<ul>";
echo "<li><a href='../index.html'>Trang sinh viên</a></li>";
echo "<li><a href='../employer/index.html'>Trang NTD</a></li>";
echo "<li><a href='../admin/index.html'>Trang Admin</a></li>";
echo "</ul>";