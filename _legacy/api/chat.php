<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];

/**
 * Kiểm tra SV có được phép chat với NTD này không.
 * - Đang làm việc (da_chap_nhan) → mở
 * - Đã nghiệm thu (hoan_thanh) → mở thêm 1 ngày sau khi giải ngân
 * - Quá 1 ngày sau nghiệm thu → khóa
 */
function can_chat($pdo, $svId, $ntdId) {
    $st = $pdo->prepare("
        SELECT COUNT(*) FROM ung_tuyen ut
        JOIN viec_lam v ON v.id = ut.viec_lam_id
        LEFT JOIN bao_dam_thanh_toan bd ON bd.ung_tuyen_id = ut.id
        WHERE ut.sinh_vien_id = ?
          AND v.nha_tuyen_dung_id = ?
          AND (
            ut.trang_thai = 'da_chap_nhan'
            OR (
              ut.trang_thai = 'hoan_thanh'
              AND bd.ngay_giai_ngan IS NOT NULL
              AND bd.ngay_giai_ngan >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            )
          )
    ");
    $st->execute([$svId, $ntdId]);
    return $st->fetchColumn() > 0;
}

/* ============================================================
   DANH SÁCH NTD ĐƯỢC PHÉP CHAT
   - Chỉ hiện NTD đang làm việc với SV (da_chap_nhan)
   - HOẶC NTD đã nghiệm thu trong vòng 1 ngày (để trao đổi cuối)
   - Quá 1 ngày → ẩn khỏi danh sách
   ============================================================ */
if ($m === 'GET' && ($_GET['action'] ?? '') === 'partners') {
    $st = $pdo->prepare("
        SELECT DISTINCT n.id, n.ten_cong_ty, n.logo,
            (SELECT noi_dung FROM tin_nhan
             WHERE sinh_vien_id=? AND nha_tuyen_dung_id=n.id
             ORDER BY id DESC LIMIT 1) AS tin_cuoi,
            (SELECT created_at FROM tin_nhan
             WHERE sinh_vien_id=? AND nha_tuyen_dung_id=n.id
             ORDER BY id DESC LIMIT 1) AS tg,
            (SELECT COUNT(*) FROM tin_nhan
             WHERE sinh_vien_id=? AND nha_tuyen_dung_id=n.id
               AND nguoi_gui='nha_tuyen_dung' AND da_doc=0) AS chua_doc
        FROM ung_tuyen ut
        JOIN viec_lam v ON v.id = ut.viec_lam_id
        JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
        LEFT JOIN bao_dam_thanh_toan bd ON bd.ung_tuyen_id = ut.id
        WHERE ut.sinh_vien_id = ?
          AND (
            ut.trang_thai = 'da_chap_nhan'
            OR (
              ut.trang_thai = 'hoan_thanh'
              AND bd.ngay_giai_ngan IS NOT NULL
              AND bd.ngay_giai_ngan >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            )
          )
        ORDER BY tg DESC
    ");
    $st->execute([$svId, $svId, $svId, $svId]);
    $items = $st->fetchAll();
    json_out(['success'=>true, 'items'=>$items]);
}

/* ============================================================
   LẤY TIN NHẮN
   ============================================================ */
if ($m === 'GET') {
    $nid = (int)($_GET['nha_tuyen_dung_id'] ?? 0);
    if (!$nid) json_out(['success'=>false,'message'=>'Thiếu NTD'], 400);

    if (!can_chat($pdo, $svId, $nid)) {
        json_out([
            'success'=>false,
            'message'=>'Chat đã bị khóa. Công việc đã nghiệm thu quá 1 ngày. Vui lòng chờ lời mời mới từ nhà tuyển dụng.',
            'locked'=>true
        ], 403);
    }

    $st = $pdo->prepare("SELECT * FROM tin_nhan
        WHERE sinh_vien_id=? AND nha_tuyen_dung_id=?
        ORDER BY id ASC");
    $st->execute([$svId, $nid]);

    $pdo->prepare("UPDATE tin_nhan SET da_doc=1
        WHERE sinh_vien_id=? AND nha_tuyen_dung_id=? AND nguoi_gui='nha_tuyen_dung'")
        ->execute([$svId, $nid]);

    json_out(['success'=>true, 'items'=>$st->fetchAll()]);
}

/* ============================================================
   GỬI TIN NHẮN
   ============================================================ */
if ($m === 'POST') {
    $d = body();
    $nid = (int)($d['nha_tuyen_dung_id'] ?? 0);
    $nd  = trim($d['noi_dung'] ?? '');
    if (!$nid || !$nd) json_out(['success'=>false,'message'=>'Thiếu dữ liệu'], 400);

    if (!can_chat($pdo, $svId, $nid)) {
        json_out([
            'success'=>false,
            'message'=>'Chat đã bị khóa sau nghiệm thu 1 ngày.',
            'locked'=>true
        ], 403);
    }

    $pdo->prepare("INSERT INTO tin_nhan (sinh_vien_id, nha_tuyen_dung_id, nguoi_gui, noi_dung)
        VALUES (?,?,'sinh_vien',?)")
        ->execute([$svId, $nid, $nd]);

    // Auto-reply demo (bỏ nếu không cần)
    $auto = [
        'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất.',
        'Bạn có thể gửi thêm portfolio để chúng tôi tham khảo nhé.',
        'Chúng tôi đã nhận được tin nhắn của bạn.'
    ];
    $pdo->prepare("INSERT INTO tin_nhan (sinh_vien_id, nha_tuyen_dung_id, nguoi_gui, noi_dung)
        VALUES (?,?,'nha_tuyen_dung',?)")
        ->execute([$svId, $nid, $auto[array_rand($auto)]]);

    json_out(['success'=>true]);
}