<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH ============ */
if ($m === 'GET' && $action === 'list') {
    $st = $pdo->query("SELECT id, ho_ten, email, vai_tro, trang_thai, last_login, created_at
        FROM quan_tri_vien ORDER BY id");
    json_out(['success'=>true, 'items'=>$st->fetchAll()]);
}

/* ============ TẠO MỚI ============ */
if ($m === 'POST' && $action === 'create') {
    $admin = require_role($pdo, ['super_admin']);
    $d = body();
    $name = trim($d['ho_ten'] ?? '');
    $email = trim($d['email'] ?? '');
    $password = $d['mat_khau'] ?? '';
    $role = $d['vai_tro'] ?? 'admin';

    if (!$name || !$email || !$password)
        json_out(['success'=>false,'message'=>'Thiếu thông tin']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        json_out(['success'=>false,'message'=>'Email không hợp lệ']);
    if (strlen($password) < 6)
        json_out(['success'=>false,'message'=>'Mật khẩu tối thiểu 6 ký tự']);
    if (!in_array($role, ['super_admin','admin','moderator','support']))
        json_out(['success'=>false,'message'=>'Vai trò không hợp lệ']);

    $chk = $pdo->prepare("SELECT id FROM quan_tri_vien WHERE email=?");
    $chk->execute([$email]);
    if ($chk->fetch()) json_out(['success'=>false,'message'=>'Email đã tồn tại']);

    $pdo->prepare("INSERT INTO quan_tri_vien (ho_ten, email, mat_khau, vai_tro, trang_thai)
        VALUES (?,?,?,?, 'hoat_dong')")
        ->execute([$name, $email, password_hash($password, PASSWORD_BCRYPT), $role]);

    log_admin($pdo, $admin['id'], 'create_admin', 'quan_tri_vien', $pdo->lastInsertId(), $email);
    json_out(['success'=>true, 'message'=>'Đã tạo tài khoản admin']);
}

/* ============ CẬP NHẬT ============ */
if ($m === 'POST' && $action === 'update') {
    $admin = require_role($pdo, ['super_admin']);
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    $fields = [];
    if (isset($d['ho_ten'])) $fields['ho_ten'] = trim($d['ho_ten']);
    if (isset($d['vai_tro']) && in_array($d['vai_tro'], ['super_admin','admin','moderator','support']))
        $fields['vai_tro'] = $d['vai_tro'];
    if (isset($d['trang_thai']) && in_array($d['trang_thai'], ['hoat_dong','bi_khoa']))
        $fields['trang_thai'] = $d['trang_thai'];
    if (!empty($d['mat_khau'])) {
        if (strlen($d['mat_khau']) < 6) json_out(['success'=>false,'message'=>'Mật khẩu tối thiểu 6 ký tự']);
        $fields['mat_khau'] = password_hash($d['mat_khau'], PASSWORD_BCRYPT);
    }

    if (empty($fields)) json_out(['success'=>false,'message'=>'Không có gì để cập nhật']);

    $set = []; $vals = [];
    foreach ($fields as $k => $v) { $set[] = "$k=?"; $vals[] = $v; }
    $vals[] = $id;
    $pdo->prepare("UPDATE quan_tri_vien SET " . implode(',', $set) . " WHERE id=?")->execute($vals);

    log_admin($pdo, $admin['id'], 'update_admin', 'quan_tri_vien', $id);
    json_out(['success'=>true, 'message'=>'Đã cập nhật']);
}

/* ============ XÓA ============ */
if ($m === 'DELETE' && $action === 'delete') {
    $admin = require_role($pdo, ['super_admin']);
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);
    if ($id === $admin['id']) json_out(['success'=>false,'message'=>'Không thể xóa chính mình']);

    $pdo->prepare("DELETE FROM quan_tri_vien WHERE id=?")->execute([$id]);
    log_admin($pdo, $admin['id'], 'delete_admin', 'quan_tri_vien', $id);
    json_out(['success'=>true, 'message'=>'Đã xóa admin']);
}