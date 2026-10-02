<?php
require_once __DIR__ . '/_helpers-admin.php';

$action = $_GET['action'] ?? '';
$data = body();

switch ($action) {

    case 'login':
        $email = trim($data['email'] ?? '');
        $password = $data['mat_khau'] ?? '';

        if (!$email || !$password)
            json_out(['success'=>false,'message'=>'Thiếu email hoặc mật khẩu']);

        $st = $pdo->prepare("SELECT * FROM quan_tri_vien WHERE email=?");
        $st->execute([$email]);
        $admin = $st->fetch();

        if (!$admin || !password_verify($password, $admin['mat_khau'])) {
            json_out(['success'=>false,'message'=>'Email hoặc mật khẩu sai']);
        }
        if ($admin['trang_thai'] !== 'hoat_dong') {
            json_out(['success'=>false,'message'=>'Tài khoản đã bị khóa']);
        }

        $_SESSION['admin_id'] = $admin['id'];
        $_SESSION['admin_name'] = $admin['ho_ten'];
        $_SESSION['admin_role'] = $admin['vai_tro'];

        $pdo->prepare("UPDATE quan_tri_vien SET last_login=NOW() WHERE id=?")
            ->execute([$admin['id']]);
        log_admin($pdo, $admin['id'], 'login', 'quan_tri_vien', $admin['id'], 'Đăng nhập hệ thống');

        unset($admin['mat_khau'], $admin['reset_token']);
        json_out(['success'=>true,'message'=>'Đăng nhập thành công','admin'=>$admin]);
        break;

    case 'logout':
        if (!empty($_SESSION['admin_id'])) {
            log_admin($pdo, $_SESSION['admin_id'], 'logout');
        }
        unset($_SESSION['admin_id'], $_SESSION['admin_name'], $_SESSION['admin_role']);
        json_out(['success'=>true]);
        break;

    case 'forgot':
        $email = trim($data['email'] ?? '');
        if (!$email) json_out(['success'=>false,'message'=>'Thiếu email']);

        $st = $pdo->prepare("SELECT id FROM quan_tri_vien WHERE email=?");
        $st->execute([$email]);
        $admin = $st->fetch();
        if (!$admin) json_out(['success'=>false,'message'=>'Email không tồn tại']);

        $token = bin2hex(random_bytes(24));
        $expires = date('Y-m-d H:i:s', time() + 3600);
        $pdo->prepare("UPDATE quan_tri_vien SET reset_token=?, reset_expires=? WHERE id=?")
            ->execute([$token, $expires, $admin['id']]);

        $link = "reset-password.html?token=$token&email=" . urlencode($email);
        json_out([
            'success'=>true,
            'message'=>'Đã tạo yêu cầu đặt lại mật khẩu (demo)',
            'reset_link'=>$link
        ]);
        break;

    case 'reset':
        $token = $data['token'] ?? '';
        $password = $data['mat_khau'] ?? '';

        if (!$token || strlen($password) < 6)
            json_out(['success'=>false,'message'=>'Mật khẩu tối thiểu 6 ký tự']);

        $st = $pdo->prepare("SELECT id FROM quan_tri_vien WHERE reset_token=? AND reset_expires > NOW()");
        $st->execute([$token]);
        $row = $st->fetch();
        if (!$row) json_out(['success'=>false,'message'=>'Link hết hạn hoặc không hợp lệ']);

        $pdo->prepare("UPDATE quan_tri_vien SET mat_khau=?, reset_token=NULL, reset_expires=NULL WHERE id=?")
            ->execute([password_hash($password, PASSWORD_BCRYPT), $row['id']]);

        json_out(['success'=>true,'message'=>'Đặt lại mật khẩu thành công']);
        break;

    case 'me':
        $admin = current_admin($pdo);
        json_out(['success'=>true,'admin'=>$admin]);
        break;

    case 'change-password':
        $admin = current_admin($pdo);
        $oldPass = $data['mat_khau_cu'] ?? '';
        $newPass = $data['mat_khau_moi'] ?? '';

        if (strlen($newPass) < 6)
            json_out(['success'=>false,'message'=>'Mật khẩu mới tối thiểu 6 ký tự']);

        $st = $pdo->prepare("SELECT mat_khau FROM quan_tri_vien WHERE id=?");
        $st->execute([$admin['id']]);
        $hash = $st->fetchColumn();

        if (!password_verify($oldPass, $hash))
            json_out(['success'=>false,'message'=>'Mật khẩu cũ không đúng']);

        $pdo->prepare("UPDATE quan_tri_vien SET mat_khau=? WHERE id=?")
            ->execute([password_hash($newPass, PASSWORD_BCRYPT), $admin['id']]);

        log_admin($pdo, $admin['id'], 'change_password');
        json_out(['success'=>true,'message'=>'Đổi mật khẩu thành công']);
        break;

    default:
        json_out(['success'=>false,'message'=>'Action không hợp lệ'], 400);
}