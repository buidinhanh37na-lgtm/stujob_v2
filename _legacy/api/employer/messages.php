<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============================================================
   DANH SÁCH HỘI THOẠI
   - Đang trong job (da_chap_nhan) → hiện
   - Đã nghiệm thu (hoan_thanh) → hiện trong 1 ngày sau khi giải ngân
   ============================================================ */
if ($m === 'GET' && $action === 'conversations') {
    $st = $pdo->prepare("
        SELECT DISTINCT sv.id AS sinh_vien_id, sv.ho_ten, sv.ma_sinh_vien, sv.anh_dai_dien,
            (SELECT noi_dung FROM tin_nhan
             WHERE nha_tuyen_dung_id=? AND sinh_vien_id=sv.id
             ORDER BY id DESC LIMIT 1) AS tin_cuoi,
            (SELECT created_at FROM tin_nhan
             WHERE nha_tuyen_dung_id=? AND sinh_vien_id=sv.id
             ORDER BY id DESC LIMIT 1) AS thoi_gian,
            (SELECT COUNT(*) FROM tin_nhan
             WHERE nha_tuyen_dung_id=? AND sinh_vien_id=sv.id
               AND nguoi_gui='sinh_vien' AND da_doc=0) AS chua_doc
        FROM ung_tuyen ut
        JOIN viec_lam v ON v.id = ut.viec_lam_id
        JOIN sinh_vien sv ON sv.id = ut.sinh_vien_id
        LEFT JOIN bao_dam_thanh_toan bd ON bd.ung_tuyen_id = ut.id
        WHERE v.nha_tuyen_dung_id = ?
          AND (
            ut.trang_thai = 'da_chap_nhan'
            OR (
              ut.trang_thai = 'hoan_thanh'
              AND bd.ngay_giai_ngan IS NOT NULL
              AND bd.ngay_giai_ngan >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            )
          )
        ORDER BY thoi_gian DESC
    ");
    $st->execute([$ntdId, $ntdId, $ntdId, $ntdId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

/* ============================================================
   LẤY TIN NHẮN
   ============================================================ */
if ($m === 'GET') {
    $svId = (int)($_GET['sinh_vien_id'] ?? 0);
    if (!$svId) json_out(['success'=>false,'message'=>'Thiếu SV'], 400);

    if (!can_chat_with_student($pdo, $ntdId, $svId)) {
        json_out([
            'success'=>false,
            'message'=>'Chat đã bị khóa. Job đã nghiệm thu quá 1 ngày. Vui lòng mời SV làm việc mới nếu muốn tiếp tục liên lạc.',
            'locked'=>true
        ], 403);
    }

    $st = $pdo->prepare("SELECT * FROM tin_nhan
        WHERE sinh_vien_id=? AND nha_tuyen_dung_id=?
        ORDER BY id ASC");
    $st->execute([$svId, $ntdId]);

    $pdo->prepare("UPDATE tin_nhan SET da_doc=1
        WHERE sinh_vien_id=? AND nha_tuyen_dung_id=? AND nguoi_gui='sinh_vien'")
        ->execute([$svId, $ntdId]);

    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

/* ============================================================
   GỬI TIN NHẮN
   ============================================================ */
if ($m === 'POST') {
    $d = body();
    $svId = (int)($d['sinh_vien_id'] ?? 0);
    $content = trim($d['noi_dung'] ?? '');
    if (!$svId || !$content) json_out(['success'=>false,'message'=>'Thiếu dữ liệu'], 400);

    if (!can_chat_with_student($pdo, $ntdId, $svId)) {
        json_out([
            'success'=>false,
            'message'=>'Chat đã bị khóa sau nghiệm thu 1 ngày.',
            'locked'=>true
        ], 403);
    }

    $pdo->prepare("INSERT INTO tin_nhan (sinh_vien_id, nha_tuyen_dung_id, nguoi_gui, noi_dung)
        VALUES (?,?, 'nha_tuyen_dung', ?)")
        ->execute([$svId, $ntdId, $content]);

    json_out(['success'=>true]);
}