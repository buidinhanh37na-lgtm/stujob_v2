<?php
require_once __DIR__ . '/../config/database.php';
header('Content-Type: text/html; charset=utf-8');

// Xoá dữ liệu cũ (tuỳ chọn)
$pdo->exec("DELETE FROM tin_nhan; DELETE FROM thong_bao; DELETE FROM giao_dich; DELETE FROM nhiem_vu;
            DELETE FROM ung_tuyen; DELETE FROM viec_lam; DELETE FROM nha_tuyen_dung;");

// Nhà tuyển dụng mẫu (mật khẩu: 123456)
$hash = password_hash('123456', PASSWORD_BCRYPT);
$ntd = [
  ['Công ty TNHH ABC Tech','hr@abctech.vn','Công nghệ thông tin','Chuyên phát triển phần mềm và gia công web/app'],
  ['Studio Thiết kế Sáng Tạo','tuyendung@sangtao.vn','Thiết kế đồ hoạ','Nhận thiết kế branding, ấn phẩm truyền thông'],
  ['Trung tâm Ngoại ngữ Viva','hr@viva.edu.vn','Giáo dục','Đào tạo tiếng Anh cho trẻ em và người đi làm'],
];
$ids = [];
$st = $pdo->prepare("INSERT INTO nha_tuyen_dung (ten_cong_ty,email,mat_khau,linh_vuc,mo_ta) VALUES (?,?,?,?,?)");
foreach ($ntd as $n) { $st->execute([$n[0],$n[1],$hash,$n[2],$n[3]]); $ids[] = $pdo->lastInsertId(); }

// Việc làm mẫu
$jobs = [
  [$ids[0],'Thực tập sinh Front-end Developer','Xây dựng giao diện web bằng HTML/CSS/JS','Biết ReactJS, làm việc nhóm tốt','HTML,CSS,JavaScript','2,4,6','08:00:00','12:00:00',1500000,2500000],
  [$ids[0],'Backend PHP Laravel Part-time','Xây dựng API cho hệ thống quản lý','Nắm vững PHP, MySQL','PHP,Laravel,MySQL','3,5','13:30:00','17:30:00',1500000,3000000],
  [$ids[1],'Designer đồ hoạ bán thời gian','Thiết kế poster, social media','Thành thạo Photoshop, Illustrator','Photoshop,Illustrator,Canva','2,3,5','18:00:00','21:00:00',1000000,2000000],
  [$ids[1],'Content Marketing Part-time','Viết content cho fanpage, blog','Kỹ năng viết tốt, sáng tạo','Content,SEO,Mạng xã hội','2,4,6','19:00:00','22:00:00',800000,1500000],
  [$ids[2],'Trợ giảng tiếng Anh cuối tuần','Hỗ trợ giáo viên chấm bài, điểm danh','Tiếng Anh giao tiếp tốt','Tiếng Anh,Giao tiếp','7,8','08:00:00','11:00:00',1000000,1800000],
  [$ids[2],'Gia sư Toán cho học sinh cấp 3','Dạy kèm Toán lớp 10-12','Kiến thức Toán vững','Toán,Sư phạm','3,5,7','19:30:00','21:30:00',1200000,2000000],
];
$st = $pdo->prepare("INSERT INTO viec_lam (nha_tuyen_dung_id,tieu_de,mo_ta,yeu_cau,ky_nang_can,thu_lam_viec,gio_bat_dau,gio_ket_thuc,luong_min,luong_max,don_vi_luong,han_chot)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
$han = date('Y-m-d', strtotime('+30 days'));
foreach ($jobs as $j) {
  $st->execute([$j[0],$j[1],$j[2],$j[3],$j[4],$j[5],$j[6],$j[7],$j[8],$j[9],'VNĐ/giờ',$han]);
}

echo "<h2>✅ Seed thành công!</h2>";
echo "<p>Đã tạo <b>".count($ids)."</b> nhà tuyển dụng và <b>".count($jobs)."</b> việc làm.</p>";
echo "<p>Bây giờ hãy vào <a href='../register.html'>Đăng ký sinh viên</a> để test.</p>";