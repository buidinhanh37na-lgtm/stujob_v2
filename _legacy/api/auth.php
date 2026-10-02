<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';

$action = $_GET['action'] ?? '';
$data   = body();

switch ($action) {

    // ============ ĐĂNG KÝ ============
    case 'register':
        $ma   = trim($data['ma_sinh_vien'] ?? '');
        $ten  = trim($data['ho_ten'] ?? '');
        $em   = trim($data['email'] ?? '');
        $mk   = $data['mat_khau'] ?? '';
        $sdt  = trim($data['so_dien_thoai'] ?? '');
        $truong = trim($data['truong'] ?? '');

        if (!$ma || !$ten || !$em || !$mk)
            json_out(['success'=>false,'message'=>'Vui lòng điền đủ thông tin bắt buộc']);
        if (!filter_var($em, FILTER_VALIDATE_EMAIL))
            json_out(['success'=>false,'message'=>'Email không hợp lệ']);
        if (strlen($mk) < 6)
            json_out(['success'=>false,'message'=>'Mật khẩu tối thiểu 6 ký tự']);

        $check = $pdo->prepare("SELECT id FROM sinh_vien WHERE email=? OR ma_sinh_vien=?");
        $check->execute([$em, $ma]);
        if ($check->fetch())
            json_out(['success'=>false,'message'=>'Email hoặc MSSV đã tồn tại']);

        $hash = password_hash($mk, PASSWORD_BCRYPT);
        $ins = $pdo->prepare("INSERT INTO sinh_vien (ma_sinh_vien,ho_ten,email,mat_khau,so_dien_thoai,truong)
                              VALUES (?,?,?,?,?,?)");
        $ins->execute([$ma,$ten,$em,$hash,$sdt,$truong]);
        json_out(['success'=>true,'message'=>'Đăng ký thành công']);
        break;

    // ============ ĐĂNG NHẬP ============
    case 'login':
        $em = trim($data['email'] ?? '');
        $mk = $data['mat_khau'] ?? '';
        $st = $pdo->prepare("SELECT * FROM sinh_vien WHERE email=?");
        $st->execute([$em]);
        $sv = $st->fetch();
        if (!$sv || !password_verify($mk, $sv['mat_khau']))
            json_out(['success'=>false,'message'=>'Email hoặc mật khẩu sai']);
        $_SESSION['sinh_vien_id'] = $sv['id'];
        unset($sv['mat_khau'], $sv['reset_token']);
        json_out(['success'=>true,'sinh_vien'=>$sv]);
        break;

    // ============ ĐĂNG XUẤT ============
    case 'logout':
        session_destroy();
        json_out(['success'=>true]);
        break;

    // ============ QUÊN MẬT KHẨU ============
    case 'forgot':
        $em = trim($data['email'] ?? '');
        $st = $pdo->prepare("SELECT id FROM sinh_vien WHERE email=?");
        $st->execute([$em]);
        $sv = $st->fetch();
        if (!$sv) json_out(['success'=>false,'message'=>'Email không tồn tại trong hệ thống']);

        $token = bin2hex(random_bytes(24));
        $exp   = date('Y-m-d H:i:s', time() + 3600); // 1 giờ
        $pdo->prepare("UPDATE sinh_vien SET reset_token=?, reset_expires=? WHERE id=?")
            ->execute([$token, $exp, $sv['id']]);

        // Trong production: gửi email bằng PHPMailer. Ở đây trả link để test:
        $link = "reset-password.html?token=$token&email=" . urlencode($em);
        json_out([
            'success'=>true,
            'message'=>'Đã tạo yêu cầu đặt lại mật khẩu. (Demo: link bên dưới)',
            'reset_link'=>$link
        ]);
        break;

    // ============ ĐẶT LẠI MẬT KHẨU ============
    case 'reset':
        $token = $data['token'] ?? '';
        $mk    = $data['mat_khau'] ?? '';
        if (!$token || strlen($mk) < 6)
            json_out(['success'=>false,'message'=>'Dữ liệu không hợp lệ']);

        $st = $pdo->prepare("SELECT id FROM sinh_vien WHERE reset_token=? AND reset_expires > NOW()");
        $st->execute([$token]);
        $row = $st->fetch();
        if (!$row) json_out(['success'=>false,'message'=>'Link đã hết hạn hoặc không hợp lệ']);

        $hash = password_hash($mk, PASSWORD_BCRYPT);
        $pdo->prepare("UPDATE sinh_vien SET mat_khau=?, reset_token=NULL, reset_expires=NULL WHERE id=?")
            ->execute([$hash, $row['id']]);
        json_out(['success'=>true,'message'=>'Đổi mật khẩu thành công']);
        break;

    // ============ LẤY THÔNG TIN ĐANG ĐĂNG NHẬP ============
    case 'me':
        $id = require_login();
        $st = $pdo->prepare("SELECT * FROM sinh_vien WHERE id=?");
        $st->execute([$id]);
        $sv = $st->fetch();
        if (!$sv) json_out(['success'=>false], 404);
        unset($sv['mat_khau'], $sv['reset_token']);
        json_out(['success'=>true,'sinh_vien'=>$sv]);
        break;

    default:
        json_out(['success'=>false,'message'=>'Action không hợp lệ'], 400);
}