<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT dg.*, sv.ho_ten, sv.ma_sinh_vien, v.tieu_de
        FROM danh_gia dg
        JOIN sinh_vien sv ON sv.id = dg.sinh_vien_id
        LEFT JOIN viec_lam v ON v.id = dg.viec_lam_id
        WHERE dg.nha_tuyen_dung_id=?
        ORDER BY dg.created_at DESC");
    $st->execute([$ntdId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($m === 'POST') {
    $d = body();
    $svId = (int)($d['sinh_vien_id'] ?? 0);
    $score = (int)($d['diem'] ?? 0);
    $comment = trim($d['nhan_xet'] ?? '');
    $jobId = !empty($d['viec_lam_id']) ? (int)$d['viec_lam_id'] : null;

    if (!$svId || $score < 1 || $score > 5)
        json_out(['success'=>false,'message'=>'Dữ liệu không hợp lệ']);

    // Kiểm tra NTD có từng thuê SV
    $chk = $pdo->prepare("SELECT COUNT(*) FROM ung_tuyen ut
        JOIN viec_lam v ON v.id = ut.viec_lam_id
        WHERE ut.sinh_vien_id=? AND v.nha_tuyen_dung_id=?
          AND ut.trang_thai IN ('da_chap_nhan','hoan_thanh')");
    $chk->execute([$svId, $ntdId]);
    if (!$chk->fetchColumn())
        json_out(['success'=>false,'message'=>'Bạn chưa từng thuê SV này']);

    $pdo->prepare("INSERT INTO danh_gia (nha_tuyen_dung_id, sinh_vien_id, viec_lam_id, diem, nhan_xet)
        VALUES (?,?,?,?,?)")
        ->execute([$ntdId, $svId, $jobId, $score, $comment]);

    // Cập nhật điểm TB
    $pdo->prepare("UPDATE sinh_vien SET
        diem_danh_gia = (SELECT AVG(diem) FROM danh_gia WHERE sinh_vien_id=?),
        so_lan_danh_gia = (SELECT COUNT(*) FROM danh_gia WHERE sinh_vien_id=?)
        WHERE id=?")
        ->execute([$svId, $svId, $svId]);

    save_sv_notification($pdo, $svId, 'Bạn nhận được đánh giá mới',
        "Điểm: $score/5. $comment", 'info');

    json_out(['success'=>true,'message'=>'Đã đánh giá sinh viên']);
}