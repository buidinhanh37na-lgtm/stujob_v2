<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';

$action = $_GET['action'] ?? '';
$data = body();

switch ($action) {

    case 'register':
        $type = $data['loai'] ?? 'doanh_nghiep';
        $name = trim($data['ten_cong_ty'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['mat_khau'] ?? '';
        $cccd = trim($data['cccd'] ?? '');
        $taxCode = trim($data['ma_so_thue'] ?? '');
        $hkdCode = trim($data['ma_so_hkd'] ?? '');
        $rep = trim($data['nguoi_dai_dien'] ?? '');
        $phone = trim($data['so_dien_thoai'] ?? '');
        $address = trim($data['dia_chi'] ?? '');
        $industry = trim($data['linh_vuc'] ?? '');

        if (!$name || !$email || !$password) json_out(['success'=>false,'message'=>'Thiếu thông tin bắt buộc']);
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_out(['success'=>false,'message'=>'Email không hợp lệ']);
        if (strlen($password) < 6) json_out(['success'=>false,'message'=>'Mật khẩu tối thiểu 6 ký tự']);
        if (!in_array($type, ['ca_nhan','ho_kinh_doanh','doanh_nghiep'])) json_out(['success'=>false,'message'=>'Loại không hợp lệ']);

        if ($type === 'ca_nhan' && !$cccd) json_out(['success'=>false,'message'=>'Cá nhân cần CCCD']);
        if ($type === 'ho_kinh_doanh' && !$hkdCode) json_out(['success'=>false,'message'=>'Hộ KD cần mã số HKD']);
        if ($type === 'doanh_nghiep' && !$taxCode) json_out(['success'=>false,'message'=>'Doanh nghiệp cần MST']);

        $check = $pdo->prepare("SELECT id FROM nha_tuyen_dung WHERE email=?");
        $check->execute([$email]);
        if ($check->fetch()) json_out(['success'=>false,'message'=>'Email đã tồn tại']);

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $ins = $pdo->prepare("INSERT INTO nha_tuyen_dung
            (ten_cong_ty, email, mat_khau, loai, cccd, ma_so_thue, ma_so_hkd,
             nguoi_dai_dien, so_dien_thoai, dia_chi, linh_vuc, trang_thai_xac_thuc, so_du)
            VALUES (?,?,?,?,?,?,?,?,?,?,?, 'chua', 0)");
        $ins->execute([$name, $email, $hash, $type, $cccd ?: null, $taxCode ?: null,
                       $hkdCode ?: null, $rep ?: null, $phone ?: null,
                       $address ?: null, $industry ?: null]);
        $newId = $pdo->lastInsertId();

        $pdo->prepare("INSERT INTO vi_ntd (nha_tuyen_dung_id, so_du) VALUES (?, 0)")->execute([$newId]);

        json_out(['success'=>true,'message'=>'Đăng ký thành công']);
        break;

    case 'login':
        $email = trim($data['email'] ?? '');
        $password = $data['mat_khau'] ?? '';
        $st = $pdo->prepare("SELECT * FROM nha_tuyen_dung WHERE email=?");
        $st->execute([$email]);
        $ntd = $st->fetch();
        if (!$ntd || !password_verify($password, $ntd['mat_khau']))
            json_out(['success'=>false,'message'=>'Email hoặc mật khẩu sai']);

        $_SESSION['nha_tuyen_dung_id'] = $ntd['id'];
        $_SESSION['nha_tuyen_dung_ten'] = $ntd['ten_cong_ty'];
        $_SESSION['nha_tuyen_dung_loai'] = $ntd['loai'];

        unset($ntd['mat_khau'], $ntd['reset_token']);
        json_out(['success'=>true,'nha_tuyen_dung'=>$ntd]);
        break;

    case 'logout':
        unset($_SESSION['nha_tuyen_dung_id'], $_SESSION['nha_tuyen_dung_ten'], $_SESSION['nha_tuyen_dung_loai']);
        json_out(['success'=>true]);
        break;

    case 'forgot':
        $email = trim($data['email'] ?? '');
        $st = $pdo->prepare("SELECT id FROM nha_tuyen_dung WHERE email=?");
        $st->execute([$email]);
        $ntd = $st->fetch();
        if (!$ntd) json_out(['success'=>false,'message'=>'Email không tồn tại']);

        $token = bin2hex(random_bytes(24));
        $expires = date('Y-m-d H:i:s', time() + 3600);
        $pdo->prepare("UPDATE nha_tuyen_dung SET reset_token=?, reset_expires=? WHERE id=?")
            ->execute([$token, $expires, $ntd['id']]);

        $link = "reset-password.html?token=$token&email=" . urlencode($email);
        json_out(['success'=>true,'message'=>'Đã tạo yêu cầu đặt lại mật khẩu','reset_link'=>$link]);
        break;

    case 'reset':
        $token = $data['token'] ?? '';
        $password = $data['mat_khau'] ?? '';
        if (!$token || strlen($password) < 6)
            json_out(['success'=>false,'message'=>'Dữ liệu không hợp lệ']);

        $st = $pdo->prepare("SELECT id FROM nha_tuyen_dung WHERE reset_token=? AND reset_expires > NOW()");
        $st->execute([$token]);
        $row = $st->fetch();
        if (!$row) json_out(['success'=>false,'message'=>'Link hết hạn']);

        $pdo->prepare("UPDATE nha_tuyen_dung SET mat_khau=?, reset_token=NULL, reset_expires=NULL WHERE id=?")
            ->execute([password_hash($password, PASSWORD_BCRYPT), $row['id']]);
        json_out(['success'=>true,'message'=>'Đổi mật khẩu thành công']);
        break;

    case 'me':
        $id = require_employer();
        $st = $pdo->prepare("SELECT * FROM nha_tuyen_dung WHERE id=?");
        $st->execute([$id]);
        $ntd = $st->fetch();
        if (!$ntd) json_out(['success'=>false], 404);
        unset($ntd['mat_khau'], $ntd['reset_token']);
        json_out(['success'=>true,'nha_tuyen_dung'=>$ntd]);
        break;

    default:
        json_out(['success'=>false,'message'=>'Action không hợp lệ'], 400);
}