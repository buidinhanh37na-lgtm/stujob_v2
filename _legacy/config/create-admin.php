<?php
/**
 * Reset mật khẩu admin → admin123
 * Truy cập: http://localhost/stujob/config/create-admin.php
 */
require_once __DIR__ . '/database.php';
header('Content-Type: text/html; charset=utf-8');

$email = 'admin@stujob.vn';
$password = 'admin123';

// Tạo hash THẬT của admin123
$hash = password_hash($password, PASSWORD_BCRYPT);

echo "<h1>🔧 Reset mật khẩu Admin</h1>";
echo "<p>Hash mới: <code style='font-size:11px'>$hash</code></p>";

// Update
$st = $pdo->prepare("UPDATE quan_tri_vien SET mat_khau=? WHERE email=?");
$st->execute([$hash, $email]);

if ($st->rowCount() > 0) {
    echo "<p style='color:green;font-size:18px'>✅ Đã cập nhật mật khẩu cho <b>$email</b></p>";
} else {
    echo "<p style='color:orange'>⚠️ Không tìm thấy admin có email = $email</p>";
    echo "<p>Kiểm tra lại email trong bảng <code>quan_tri_vien</code></p>";
}

// Verify lại
$check = $pdo->prepare("SELECT id, ho_ten, email, mat_khau FROM quan_tri_vien WHERE email=?");
$check->execute([$email]);
$adm = $check->fetch();

if ($adm) {
    $ok = password_verify($password, $adm['mat_khau']);
    echo "<h2>🧪 Test đăng nhập</h2>";
    echo "<p>Password <code>$password</code> khớp hash: " .
        ($ok ? "<span style='color:green;font-weight:700'>✅ CÓ — Đăng nhập được!</span>"
             : "<span style='color:red;font-weight:700'>❌ KHÔNG</span>") . "</p>";
}

echo "<hr>";
echo "<h2>🔗 Đăng nhập ngay:</h2>";
echo "<p style='font-size:18px'><a href='../admin/login.html'>→ Vào trang login admin</a></p>";
echo "<p>Email: <b>admin@stujob.vn</b> — Mật khẩu: <b>admin123</b></p>";