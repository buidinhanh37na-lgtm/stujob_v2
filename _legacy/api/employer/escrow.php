<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($m === 'GET' && $action === 'wallet') {
    $w = $pdo->prepare("SELECT so_du FROM vi_ntd WHERE nha_tuyen_dung_id=?");
    $w->execute([$ntdId]);
    $bal = $w->fetchColumn();
    if ($bal === false) {
        $pdo->prepare("INSERT INTO vi_ntd (nha_tuyen_dung_id, so_du) VALUES (?, 0)")->execute([$ntdId]);
        $bal = 0;
    }
    json_out(['success'=>true,'so_du'=>(float)$bal]);
}

if ($m === 'POST' && $action === 'deposit') {
    $amount = (float)($_POST['so_tien'] ?? body()['so_tien'] ?? 0);
    if ($amount <= 0) json_out(['success'=>false,'message'=>'Số tiền không hợp lệ']);

    $pdo->prepare("INSERT IGNORE INTO vi_ntd (nha_tuyen_dung_id, so_du) VALUES (?, 0)")->execute([$ntdId]);
    $pdo->prepare("UPDATE vi_ntd SET so_du = so_du + ? WHERE nha_tuyen_dung_id=?")
        ->execute([$amount, $ntdId]);

    save_ntd_notification($pdo, $ntdId, 'Nạp ví thành công',
        'Đã nạp ' . number_format($amount) . 'đ (giả lập)', 'wallet');

    json_out(['success'=>true,'message'=>'Nạp ví thành công (giả lập)']);
}

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT bd.*, v.tieu_de, sv.ho_ten, sv.ma_sinh_vien
        FROM bao_dam_thanh_toan bd
        JOIN viec_lam v ON v.id = bd.viec_lam_id
        JOIN sinh_vien sv ON sv.id = bd.sinh_vien_id
        WHERE bd.nha_tuyen_dung_id=?
        ORDER BY bd.created_at DESC");
    $st->execute([$ntdId]);
    $items = $st->fetchAll();
    $tong = 0;
    foreach ($items as $it) {
        if (in_array($it['trang_thai'], ['da_nap','cho_nghiem_thu'])) {
            $tong += (float)$it['so_tien'];
        }
    }
    json_out(['success'=>true,'items'=>$items,'tong_ky_quy'=>$tong]);
}

if ($m === 'POST' && $action === 'activate') {
    $d = body();
    $escrowId = (int)($d['id'] ?? 0);
    $bd = $pdo->prepare("SELECT * FROM bao_dam_thanh_toan WHERE id=? AND nha_tuyen_dung_id=?");
    $bd->execute([$escrowId, $ntdId]);
    $e = $bd->fetch();
    if (!$e) json_out(['success'=>false,'message'=>'Không tìm thấy']);
    if ($e['trang_thai'] !== 'cho_nap') json_out(['success'=>false,'message'=>'Đã xử lý']);

    $total = (float)$e['so_tien'] + (float)$e['phi_dich_vu'];

    $w = $pdo->prepare("SELECT so_du FROM vi_ntd WHERE nha_tuyen_dung_id=?");
    $w->execute([$ntdId]);
    $bal = (float)$w->fetchColumn();

    if ($bal < $total) {
        json_out(['success'=>false,'message'=>'Số dư không đủ. Cần thêm ' . number_format($total - $bal) . 'đ']);
    }

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE vi_ntd SET so_du = so_du - ? WHERE nha_tuyen_dung_id=?")
            ->execute([$total, $ntdId]);
        $pdo->prepare("UPDATE bao_dam_thanh_toan SET trang_thai='da_nap' WHERE id=?")
            ->execute([$escrowId]);

        save_sv_notification($pdo, $e['sinh_vien_id'], 'Bảo đảm thanh toán đã kích hoạt',
            'NTD đã nạp tiền vào escrow cho công việc của bạn', 'escrow');

        $pdo->commit();
        json_out(['success'=>true,'message'=>'Đã kích hoạt bảo đảm thanh toán']);
    } catch (Exception $ex) {
        $pdo->rollBack();
        json_out(['success'=>false,'message'=>'Lỗi: ' . $ex->getMessage()]);
    }
}