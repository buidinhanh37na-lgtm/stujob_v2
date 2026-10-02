<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============================================================
   1. LẤY SỐ DƯ + DANH SÁCH GIAO DỊCH
   Chỉ chạy khi KHÔNG có action → tránh chặn các action khác
   ============================================================ */
if ($m === 'GET' && $action === '') {
    $st = $pdo->prepare("SELECT * FROM giao_dich WHERE sinh_vien_id=? ORDER BY created_at DESC");
    $st->execute([$svId]);
    $items = $st->fetchAll();

    // Lấy số dư THỰC từ bảng vi_tien (nguồn chân lý)
    $w = $pdo->prepare("SELECT so_du FROM vi_tien WHERE sinh_vien_id=?");
    $w->execute([$svId]);
    $soDu = (float)($w->fetchColumn() ?: 0);

    // Tính tổng thu / chi
    $thu = 0; $chi = 0;
    foreach ($items as $it) {
        if ($it['trang_thai'] !== 'thanh_cong') continue;
        if ($it['loai'] === 'thu_nhap') $thu += (float)$it['so_tien'];
        else $chi += (float)$it['so_tien'];
    }

    json_out([
        'success' => true,
        'items' => $items,
        'tong_thu' => $thu,
        'tong_chi' => $chi,
        'so_du' => $soDu
    ]);
}

/* ============================================================
   2. TẠO GIAO DỊCH THỦ CÔNG
   Chỉ chạy khi POST không có action
   ============================================================ */
if ($m === 'POST' && $action === '') {
    $d = body();
    $pdo->prepare("INSERT INTO giao_dich (sinh_vien_id,so_tien,loai,mo_ta,trang_thai) VALUES (?,?,?,?,?)")
        ->execute([$svId, $d['so_tien'], $d['loai'], $d['mo_ta'] ?? '', 'cho_xu_ly']);
    json_out(['success' => true, 'message' => 'Đã gửi yêu cầu']);
}

/* ============================================================
   3. RÚT TIỀN — GIẢ LẬP
   Trừ ví ngay, không cần admin duyệt
   ============================================================ */
if ($m === 'POST' && $action === 'withdraw') {
    $d = body();
    $amount = (float)($d['so_tien'] ?? 0);
    $bank = trim($d['ngan_hang'] ?? '');
    $accountNo = trim($d['so_tai_khoan'] ?? '');
    $accountName = trim($d['chu_tai_khoan'] ?? '');

    // Validate
    if ($amount < 50000)
        json_out(['success' => false, 'message' => 'Số tiền rút tối thiểu 50.000đ']);
    if ($amount > 50000000)
        json_out(['success' => false, 'message' => 'Số tiền rút tối đa 50.000.000đ']);
    if (!$bank || !$accountNo || !$accountName)
        json_out(['success' => false, 'message' => 'Vui lòng điền đầy đủ thông tin ngân hàng']);

    // Lấy số dư hiện tại
    $st = $pdo->prepare("SELECT so_du FROM vi_tien WHERE sinh_vien_id=?");
    $st->execute([$svId]);
    $balance = (float)($st->fetchColumn() ?: 0);

    if ($balance < $amount)
        json_out([
            'success' => false,
            'message' => 'Số dư không đủ. Hiện có: ' . number_format($balance) . 'đ'
        ]);

    $pdo->beginTransaction();
    try {
        // 1. Trừ ví NGAY
        $pdo->prepare("UPDATE vi_tien SET so_du = so_du - ? WHERE sinh_vien_id=?")
            ->execute([$amount, $svId]);

        // 2. Tạo yêu cầu rút — status da_chuyen (giả lập thành công ngay)
        $pdo->prepare("INSERT INTO yeu_cau_rut_tien
            (sinh_vien_id, so_tien, ngan_hang, so_tai_khoan, chu_tai_khoan, trang_thai, ghi_chu)
            VALUES (?,?,?,?,?, 'da_chuyen', 'Giả lập - Rút thành công ngay')")
            ->execute([$svId, $amount, $bank, $accountNo, $accountName]);

        $reqId = $pdo->lastInsertId();

        // 3. Ghi giao dịch ví — status thanh_cong luôn
        $pdo->prepare("INSERT INTO giao_dich
            (sinh_vien_id, so_tien, loai, mo_ta, trang_thai)
            VALUES (?,?, 'rut_tien', ?, 'thanh_cong')")
            ->execute([
                $svId,
                $amount,
                "Rút tiền #$reqId về $bank - $accountNo"
            ]);

        // 4. Thông báo
        if (function_exists('save_notification')) {
            save_notification(
                $pdo,
                $svId,
                '💸 Rút tiền thành công',
                "Đã rút " . number_format($amount) . "đ về $bank - $accountNo (giả lập).",
                'success'
            );
        }

        $pdo->commit();

        json_out([
            'success' => true,
            'message' => 'Đã rút ' . number_format($amount) . 'đ thành công! (giả lập)',
            'request_id' => $reqId
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        json_out(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
    }
}

/* ============================================================
   4. LỊCH SỬ RÚT TIỀN
   ============================================================ */
if ($m === 'GET' && $action === 'withdraw-history') {
    $st = $pdo->prepare("SELECT * FROM yeu_cau_rut_tien 
        WHERE sinh_vien_id=? 
        ORDER BY created_at DESC LIMIT 20");
    $st->execute([$svId]);
    json_out(['success' => true, 'items' => $st->fetchAll()]);
}