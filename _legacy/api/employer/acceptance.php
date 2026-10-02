<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Danh sách bài nộp
if ($m === 'GET' && $action !== 'view_file') {
    $st = $pdo->prepare("SELECT nv.id, nv.ten_nhiem_vu, nv.trang_thai AS trang_thai_nv,
        nv.han_nop, nv.file_san_pham AS file_goc, nv.file_xem_truoc,
        sv.ho_ten, sv.ma_sinh_vien, v.tieu_de, v.nha_tuyen_dung_id, v.id AS viec_lam_id
        FROM nhiem_vu nv
        JOIN sinh_vien sv ON sv.id = nv.sinh_vien_id
        JOIN viec_lam v ON v.id = nv.viec_lam_id
        WHERE v.nha_tuyen_dung_id=?
        ORDER BY nv.created_at DESC");
    $st->execute([$ntdId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

// Xem file — giới hạn 3 trang nếu chưa nghiệm thu
if ($m === 'GET' && $action === 'view_file') {
    $taskId = (int)($_GET['id'] ?? 0);
    if (!$taskId) { http_response_code(400); exit('Thiếu ID'); }

    // ✅ Dùng LEFT JOIN để chịu được nhiệm vụ không có viec_lam_id
    $st = $pdo->prepare("SELECT nv.*, v.nha_tuyen_dung_id
        FROM nhiem_vu nv
        LEFT JOIN viec_lam v ON v.id = nv.viec_lam_id
        WHERE nv.id = ?");
    $st->execute([$taskId]);
    $nv = $st->fetch();

    if (!$nv) { http_response_code(404); exit('Không tìm thấy nhiệm vụ'); }

    // ✅ Chấp nhận cả trường hợp nhiệm vụ không gắn viec_lam_id
    // (fallback: kiểm tra qua ung_tuyen)
    $ownsTask = false;
    if (!empty($nv['nha_tuyen_dung_id']) && (int)$nv['nha_tuyen_dung_id'] === (int)$ntdId) {
        $ownsTask = true;
    } else {
        // Kiểm tra qua ung_tuyen → viec_lam
        $chk = $pdo->prepare("SELECT COUNT(*) FROM ung_tuyen ut
            JOIN viec_lam v ON v.id = ut.viec_lam_id
            WHERE ut.sinh_vien_id = ? AND ut.viec_lam_id = ?
              AND v.nha_tuyen_dung_id = ?");
        $chk->execute([$nv['sinh_vien_id'], $nv['viec_lam_id'] ?? 0, $ntdId]);
        if ($chk->fetchColumn() > 0) $ownsTask = true;
    }

    if (!$ownsTask) { http_response_code(403); exit('Không có quyền'); }

    // Xác định file cần serve
    $isDone = ($nv['trang_thai'] === 'hoan_thanh');
    $fileToServe = null;

    if ($isDone && !empty($nv['file_san_pham'])) {
        // Đã nghiệm thu → dùng file gốc
        $fileToServe = __DIR__ . '/../../' . $nv['file_san_pham'];
    } else {
        // Chưa nghiệm thu → preview, fallback về file gốc
        if (!empty($nv['file_xem_truoc'])) {
            $p = __DIR__ . '/../../' . $nv['file_xem_truoc'];
            if (file_exists($p)) $fileToServe = $p;
        }
        if (!$fileToServe && !empty($nv['file_san_pham'])) {
            $fileToServe = __DIR__ . '/../../' . $nv['file_san_pham'];
        }
    }

    if (!$fileToServe || !file_exists($fileToServe)) {
        http_response_code(404);
        exit('File không tồn tại: ' . ($fileToServe ?: ''));
    }

    // Serve file
    $mime = mime_content_type($fileToServe) ?: 'application/octet-stream';
    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . basename($fileToServe) . '"');
    if (!$isDone) header('X-Preview-Only: 1');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    readfile($fileToServe);
    exit;
}

// Nghiệm thu
// Nghiệm thu
if ($m === 'POST' && $action === 'accept') {
    $d = body();
    $taskId = (int)($d['nhiem_vu_id'] ?? 0);
    $accept = (int)($d['chap_nhan'] ?? 1) === 1;
    $feedback = trim($d['nhan_xet'] ?? '');

    $st = $pdo->prepare("SELECT nv.*, v.nha_tuyen_dung_id, v.id AS viec_lam_id
        FROM nhiem_vu nv
        JOIN viec_lam v ON v.id = nv.viec_lam_id
        WHERE nv.id=?");
    $st->execute([$taskId]);
    $nv = $st->fetch();
    if (!$nv || $nv['nha_tuyen_dung_id'] != $ntdId)
        json_out(['success'=>false,'message'=>'Không tìm thấy']);

    $pdo->beginTransaction();
    try {
        if ($accept) {
            // ⭐ Đánh dấu nhiệm vụ hoàn thành TRƯỚC khi tính phí
            // (để count completed chính xác nếu có nhiều đơn)
            $pdo->prepare("UPDATE nhiem_vu SET trang_thai='hoan_thanh' WHERE id=?")
                ->execute([$taskId]);

            // Lấy escrow
            $esc = $pdo->prepare("SELECT id, so_tien FROM bao_dam_thanh_toan
                WHERE viec_lam_id=? AND sinh_vien_id=? AND trang_thai IN ('da_nap','cho_nghiem_thu')
                LIMIT 1");
            $esc->execute([$nv['viec_lam_id'], $nv['sinh_vien_id']]);
            $e = $esc->fetch();

            $thucNhan = 0;
            $phiSV = 0;

            if ($e) {
                $pdo->prepare("UPDATE bao_dam_thanh_toan SET trang_thai='da_giai_ngan', ngay_giai_ngan=NOW()
                    WHERE id=?")->execute([$e['id']]);

                // ⭐ Tính phí dịch vụ SV (3% sau 10 đơn hoàn thành)
                require_once __DIR__ . '/../_helpers.php';
                $feeInfo = calc_sv_fee($pdo, $nv['sinh_vien_id'], (float)$e['so_tien']);
                $phiSV = $feeInfo['fee'];
                $thucNhan = (float)$e['so_tien'] - $phiSV;

                // Cộng tiền cho SV (đã trừ phí)
                $pdo->prepare("INSERT IGNORE INTO vi_tien (sinh_vien_id, so_du) VALUES (?, 0)")
                    ->execute([$nv['sinh_vien_id']]);
                $pdo->prepare("UPDATE vi_tien SET so_du = so_du + ? WHERE sinh_vien_id=?")
                    ->execute([$thucNhan, $nv['sinh_vien_id']]);

                // Ghi lịch sử giao dịch — có ghi rõ phí sàn
                $moTa = 'Thu nhập từ nghiệm thu: ' . $nv['ten_nhiem_vu'];
                if ($phiSV > 0) {
                    $moTa .= ' (đã trừ phí sàn ' . number_format($phiSV) . 'đ)';
                }
                $pdo->prepare("INSERT INTO giao_dich
                    (sinh_vien_id, so_tien, phi_san, loai, mo_ta, trang_thai)
                    VALUES (?,?,?, 'thu_nhap', ?, 'thanh_cong')")
                    ->execute([$nv['sinh_vien_id'], $thucNhan, $phiSV, $moTa]);
            }

            // Update ứng tuyển
            $pdo->prepare("UPDATE ung_tuyen SET trang_thai='hoan_thanh'
                WHERE viec_lam_id=? AND sinh_vien_id=?")
                ->execute([$nv['viec_lam_id'], $nv['sinh_vien_id']]);

            // ⭐ Thông báo chi tiết cho SV
            $thongBao = 'Bạn đã nhận ' . number_format($thucNhan) . 'đ từ nghiệm thu: ' . $nv['ten_nhiem_vu'];
            if ($phiSV > 0) {
                $thongBao .= '. Phí dịch vụ 3%: ' . number_format($phiSV) . 'đ (đã trừ).';
            } else {
                $conLai = max(0, 10 - ($feeInfo['completed_count'] ?? 0));
                if ($conLai > 0) {
                    $thongBao .= '. Bạn còn ' . $conLai . ' đơn miễn phí trước khi áp dụng phí 3%.';
                }
            }
            if ($feedback) $thongBao .= ' Nhận xét: ' . $feedback;

            save_sv_notification($pdo, $nv['sinh_vien_id'],
                '✅ Bài nộp đã được nghiệm thu', $thongBao, 'success');

        } else {
            $pdo->prepare("UPDATE nhiem_vu SET trang_thai='dang_lam' WHERE id=?")
                ->execute([$taskId]);
            save_sv_notification($pdo, $nv['sinh_vien_id'], 'Bài nộp cần chỉnh sửa',
                $feedback ?: 'Vui lòng xem lại và nộp lại', 'info');
        }

        $pdo->commit();
        json_out(['success'=>true,'message'=>$accept
            ? 'Đã nghiệm thu và giải ngân'
            : 'Đã gửi yêu cầu chỉnh sửa']);
    } catch (Exception $ex) {
        $pdo->rollBack();
        json_out(['success'=>false,'message'=>'Lỗi: ' . $ex->getMessage()]);
    }
}