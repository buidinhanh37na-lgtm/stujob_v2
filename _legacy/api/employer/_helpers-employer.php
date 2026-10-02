<?php
require_once __DIR__ . '/../_helpers.php';

/** Tạo file preview 3 trang / watermark */
function create_preview_file($sourceFile, $fileType) {
    $srcDir = __DIR__ . '/../../uploads/submissions/';
    $preDir = __DIR__ . '/../../uploads/previews/';
    if (!is_dir($preDir)) mkdir($preDir, 0777, true);

    $srcPath = $srcDir . basename($sourceFile);
    if (!file_exists($srcPath)) return null;

    $ext = strtolower($fileType);
    $preName = 'pre_' . time() . '_' . basename($sourceFile);

    // ---- ẢNH: watermark + resize ----
    if (in_array($ext, ['jpg','jpeg','png','webp'])) {
        $info = @getimagesize($srcPath);
        if (!$info) return null;

        switch ($info['mime']) {
            case 'image/jpeg': $img = imagecreatefromjpeg($srcPath); break;
            case 'image/png':  $img = imagecreatefrompng($srcPath); break;
            case 'image/webp': $img = imagecreatefromwebp($srcPath); break;
            default: return null;
        }
        if (!$img) return null;

        $w = imagesx($img); $h = imagesy($img);
        if ($w > 900) {
            $newW = 900; $newH = (int)($h * 900 / $w);
            $new = imagecreatetruecolor($newW, $newH);
            imagecopyresampled($new, $img, 0,0,0,0, $newW,$newH, $w,$h);
            $img = $new; $w = $newW; $h = $newH;
        }

        // Watermark đỏ
        $red = imagecolorallocatealpha($img, 220, 38, 38, 40);
        $text = 'BAN XEM TRUOC - CHUA NGHIEM THU';
        $fs = 5;
        $tw = imagefontwidth($fs) * strlen($text);
        $x = max(10, ($w - $tw) / 2);
        imagestring($img, $fs, $x, 20, $text, $red);
        imagestring($img, $fs, $x, $h - 40, $text, $red);

        imagejpeg($img, $preDir . $preName, 75);
        return 'uploads/previews/' . $preName;
    }

    // ---- PDF: copy (JS sẽ tự cắt 3 trang) ----
    if ($ext === 'pdf') {
        copy($srcPath, $preDir . $preName);
        return 'uploads/previews/' . $preName;
    }

    return null;
}

/** Kiểm tra NTD có thể chat với SV — CHỈ khi ứng tuyển đã được duyệt */
/** Kiểm tra NTD có thể chat với SV — chỉ khi duyệt hoặc trong 1 ngày sau nghiệm thu */
function can_chat_with_student($pdo, $ntdId, $svId) {
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

/** Phí dịch vụ: miễn phí 5 tin đầu, sau đó 10% */
function calc_service_fee($postedCount, $salary) {
    if ($postedCount < 5) return 0;
    return round($salary * 0.10);
}