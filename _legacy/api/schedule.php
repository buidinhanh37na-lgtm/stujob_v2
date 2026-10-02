<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();
$m = $_SERVER['REQUEST_METHOD'];
$act = $_GET['action'] ?? '';

if ($m === 'GET') {
    $st = $pdo->prepare("SELECT * FROM lich_hoc WHERE sinh_vien_id=? ORDER BY thu, gio_bat_dau");
    $st->execute([$svId]);
    json_out(['success'=>true,'items'=>$st->fetchAll()]);
}

if ($m === 'POST' && $act === 'import') {
    if (!isset($_FILES['file'])) json_out(['success'=>false,'message'=>'Thiếu file CSV']);
    $tmp = $_FILES['file']['tmp_name'];
    $fh = fopen($tmp, 'r');
    if (!$fh) json_out(['success'=>false,'message'=>'Không đọc được file']);

    // Xoá BOM nếu có
    $bom = fread($fh, 3);
    if ($bom !== "\xEF\xBB\xBF") rewind($fh);

    $header = fgetcsv($fh); // bỏ header
    $rows = [];
    $ins = $pdo->prepare("INSERT INTO lich_hoc (sinh_vien_id,thu,gio_bat_dau,gio_ket_thuc,mon_hoc,phong_hoc,ghi_chu) VALUES (?,?,?,?,?,?,?)");
    while (($r = fgetcsv($fh)) !== false) {
        if (count($r) < 4) continue;
        $thu = trim($r[0]);
        // Cho phép "2".."8" hoặc "Thứ 2" ... "Chủ nhật"
        if (!is_numeric($thu)) {
            $map = ['thứ 2'=>2,'thứ hai'=>2,'thu 2'=>2,'t2'=>2,
                    'thứ 3'=>3,'thứ ba'=>3,'t3'=>3,
                    'thứ 4'=>4,'thứ tư'=>4,'t4'=>4,
                    'thứ 5'=>5,'thứ năm'=>5,'t5'=>5,
                    'thứ 6'=>6,'thứ sáu'=>6,'t6'=>6,
                    'thứ 7'=>7,'thứ bảy'=>7,'t7'=>7,
                    'chủ nhật'=>8,'cn'=>8,'chunhat'=>8];
            $k = mb_strtolower($thu);
            $thu = $map[$k] ?? 0;
        }
        $thu = (int)$thu;
        if ($thu < 2 || $thu > 8) continue;
        $ins->execute([$svId,$thu,$r[1],$r[2],$r[3] ?? '',$r[4] ?? '',$r[5] ?? '']);
        $rows[] = $r;
    }
    fclose($fh);
    json_out(['success'=>true,'message'=>'Đã nhập '.count($rows).' dòng','count'=>count($rows)]);
}

if ($m === 'POST') {
    $d = body();
    $pdo->prepare("INSERT INTO lich_hoc (sinh_vien_id,thu,gio_bat_dau,gio_ket_thuc,mon_hoc,phong_hoc,ghi_chu) VALUES (?,?,?,?,?,?,?)")
        ->execute([$svId,$d['thu'],$d['gio_bat_dau'],$d['gio_ket_thuc'],$d['mon_hoc']??'', $d['phong_hoc']??'', $d['ghi_chu']??'']);
    json_out(['success'=>true,'message'=>'Đã thêm lịch học']);
}

if ($m === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        $pdo->prepare("DELETE FROM lich_hoc WHERE sinh_vien_id=?")->execute([$svId]);
        json_out(['success'=>true,'message'=>'Đã xoá toàn bộ lịch học']);
    }
    $pdo->prepare("DELETE FROM lich_hoc WHERE id=? AND sinh_vien_id=?")->execute([$id,$svId]);
    json_out(['success'=>true]);
}


/* ============================================================
   TẢI FILE CSV MẪU — UTF-8 BOM để hỗ trợ tiếng Việt trong Excel
   ============================================================ */
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'download-template') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="lich-hoc-mau.csv"');
    header('Cache-Control: no-cache');

    $out = fopen('php://output', 'w');

    // UTF-8 BOM — Excel đọc đúng tiếng Việt
    fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));

    // Header
    fputcsv($out, ['thu', 'gio_bat_dau', 'gio_ket_thuc', 'mon_hoc', 'phong_hoc', 'ghi_chu']);

    // Dữ liệu mẫu — có tiếng Việt có dấu
    fputcsv($out, ['2', '07:00', '09:30', 'Lập trình hướng đối tượng', 'A101', '']);
    fputcsv($out, ['2', '13:30', '16:00', 'Cơ sở dữ liệu', 'B202', '']);
    fputcsv($out, ['3', '07:00', '09:30', 'Giải tích 2', 'A102', '']);
    fputcsv($out, ['4', '09:30', '11:30', 'Kỹ thuật lập trình', 'Lab3', '']);
    fputcsv($out, ['4', '13:30', '16:00', 'Tiếng Anh B1', 'D404', '']);
    fputcsv($out, ['5', '07:00', '09:30', 'Mạng máy tính', 'B301', '']);
    fputcsv($out, ['6', '13:30', '16:00', 'Lập trình Web', 'Lab1', '']);
    fputcsv($out, ['7', '07:00', '10:00', 'Thể dục', 'Nhà thi đấu', '']);

    fclose($out);
    exit;
}