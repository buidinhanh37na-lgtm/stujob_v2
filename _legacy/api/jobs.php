<?php
require_once __DIR__ . '/_helpers.php';
require_once __DIR__ . '/../config/database.php';
$svId = require_login();

/* ============================================================
   MAP CHUYÊN NGÀNH ↔ NHÓM VIỆC
   ============================================================ */
function get_chuyen_nganh_keywords($chuyenNganh) {
    $map = [
        'công nghệ thông tin' => ['IT', 'Lập trình', 'Công nghệ', 'Web', 'Frontend', 'Backend'],
        'khoa học máy tính'   => ['IT', 'Lập trình', 'Công nghệ', 'Web'],
        'kỹ thuật phần mềm'   => ['IT', 'Lập trình', 'Web', 'Frontend', 'Backend'],
        'hệ thống thông tin'  => ['IT', 'Công nghệ'],
        'an toàn thông tin'   => ['IT', 'Công nghệ'],
        'marketing'           => ['Marketing', 'Content', 'Bán hàng', 'Sale'],
        'truyền thông'        => ['Marketing', 'Content'],
        'quảng cáo'           => ['Marketing', 'Content'],
        'tiếng anh'           => ['Giáo dục', 'Ngoại ngữ', 'Gia sư'],
        'ngôn ngữ anh'        => ['Giáo dục', 'Ngoại ngữ', 'Gia sư'],
        'sư phạm'             => ['Giáo dục', 'Gia sư'],
        'đồ họa'              => ['Thiết kế', 'Đồ họa', 'Designer'],
        'thiết kế'            => ['Thiết kế', 'Đồ họa', 'Designer'],
        'mỹ thuật'            => ['Thiết kế', 'Đồ họa'],
        'kinh tế'             => ['Kinh doanh', 'Bán hàng', 'Sale', 'Marketing'],
        'kế toán'             => ['Kinh doanh', 'Bán hàng'],
        'tài chính'           => ['Kinh doanh', 'Bán hàng'],
        'quản trị kinh doanh' => ['Kinh doanh', 'Bán hàng', 'Marketing'],
        'du lịch'             => ['F&B', 'Nhà hàng', 'Phục vụ'],
        'nhà hàng'            => ['F&B', 'Nhà hàng', 'Phục vụ'],
        'khách sạn'           => ['F&B', 'Nhà hàng', 'Phục vụ'],
        'vận tải'             => ['Giao hàng', 'Vận chuyển'],
        'logistics'           => ['Giao hàng', 'Vận chuyển'],
    ];

    $chuyenNganh = mb_strtolower(trim($chuyenNganh ?? ''));
    if (!$chuyenNganh) return [];

    foreach ($map as $key => $keywords) {
        if (mb_strpos($chuyenNganh, $key) !== false) {
            return $keywords;
        }
    }
    return [];
}

/* ============================================================
   TÍNH ĐIỂM PHÙ HỢP — Trả về null nếu không phù hợp
   ============================================================ */
function tinh_diem_phu_hop($job, $lichHoc, $kyNangSV, $chuyenNganhSV, $nhomViecTen) {
    $diemThoiGian = 0;
    $diemKyNang = 0;
    $diemChuyenNganh = 0;

    /* --- 1. THỜI GIAN (40 điểm) --- */
    $days = array_filter(array_map('trim', explode(',', $job['thu_lam_viec'] ?? '')));
    $tongBuoi = count($days);

    if ($tongBuoi === 0) {
        $diemThoiGian = 20; // Job không có ngày cố định
    } else {
        $soBuoiKhop = 0;
        foreach ($days as $d) {
            $coTrungLich = false;
            foreach ($lichHoc as $lh) {
                if ((int)$lh['thu'] === (int)$d) {
                    if ($lh['gio_bat_dau'] < $job['gio_ket_thuc'] 
                        && $lh['gio_ket_thuc'] > $job['gio_bat_dau']) {
                        $coTrungLich = true;
                        break;
                    }
                }
            }
            if (!$coTrungLich) $soBuoiKhop++;
        }

        // Trùng > 50% số buổi → loại
        if ($soBuoiKhop / $tongBuoi < 0.5) return null;

        $diemThoiGian = ($soBuoiKhop / $tongBuoi) * 40;
    }

    /* --- 2. KỸ NĂNG (35 điểm) --- */
    $kyNangCan = array_filter(array_map('trim', explode(',', $job['ky_nang_can'] ?? '')));
    $kyNangSVNames = array_map(fn($k) => mb_strtolower($k['ten_ky_nang'] ?? ''), $kyNangSV);

    if (count($kyNangCan) === 0) {
        $diemKyNang = 15;
    } else {
        $soKhop = 0;
        foreach ($kyNangCan as $kc) {
            $kc = mb_strtolower($kc);
            foreach ($kyNangSVNames as $svKn) {
                if (mb_stripos($svKn, $kc) !== false || mb_stripos($kc, $svKn) !== false) {
                    $soKhop++;
                    break;
                }
            }
        }
        $diemKyNang = ($soKhop / count($kyNangCan)) * 35;
    }

    /* --- 3. CHUYÊN NGÀNH (25 điểm) --- */
    $keywords = get_chuyen_nganh_keywords($chuyenNganhSV);
    $nhomViecTen = $nhomViecTen ?? '';

    if (count($keywords) > 0 && $nhomViecTen) {
        $match = false;
        foreach ($keywords as $kw) {
            if (mb_stripos($nhomViecTen, $kw) !== false) {
                $diemChuyenNganh = 25;
                $match = true;
                break;
            }
        }
        if (!$match) $diemChuyenNganh = 5;
    } else {
        $diemChuyenNganh = 10; // Không có data để đánh giá
    }

    return [
        'tong' => round($diemThoiGian + $diemKyNang + $diemChuyenNganh, 1),
        'chi_tiet' => [
            'thoi_gian' => round($diemThoiGian, 1),
            'ky_nang' => round($diemKyNang, 1),
            'chuyen_nganh' => round($diemChuyenNganh, 1),
        ]
    ];
}

/* ============================================================
   LẤY DATA SV
   ============================================================ */
$svSt = $pdo->prepare("SELECT chuyen_nganh FROM sinh_vien WHERE id=?");
$svSt->execute([$svId]);
$svInfo = $svSt->fetch();
$chuyenNganhSV = $svInfo['chuyen_nganh'] ?? '';

$knSt = $pdo->prepare("SELECT ten_ky_nang, muc_do FROM ky_nang WHERE sinh_vien_id=?");
$knSt->execute([$svId]);
$kyNangSV = $knSt->fetchAll();

$st = $pdo->prepare("SELECT * FROM lich_hoc WHERE sinh_vien_id=?");
$st->execute([$svId]);
$lichHoc = $st->fetchAll();

/* ============================================================
   LẤY TẤT CẢ JOB
   ============================================================ */
$jobs = $pdo->query("SELECT v.*, n.ten_cong_ty, n.logo, n.linh_vuc,
                     nv.ten_nhom AS nhom_viec_ten, nv.icon AS nhom_viec_icon
                     FROM viec_lam v
                     JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
                     LEFT JOIN nhom_viec nv ON nv.id = v.nhom_viec_id
                     WHERE v.trang_thai='dang_mo'
                     ORDER BY v.created_at DESC")->fetchAll();

/* ============================================================
   TÍNH ĐIỂM TỪNG JOB
   ============================================================ */
$phuHop = [];
$tatCa = [];

foreach ($jobs as $j) {
    $diem = tinh_diem_phu_hop($j, $lichHoc, $kyNangSV, $chuyenNganhSV, $j['nhom_viec_ten']);

    $j['diem_phu_hop'] = $diem ? $diem['tong'] : 0;
    $j['chi_tiet_diem'] = $diem ? $diem['chi_tiet'] : null;

    $tatCa[] = $j;

    if ($diem && $diem['tong'] >= 50) { // Chỉ nhận >= 50 điểm
        $phuHop[] = $j;
    }
}

// Sort giảm dần theo điểm
usort($phuHop, fn($a, $b) => $b['diem_phu_hop'] <=> $a['diem_phu_hop']);

/* ============================================================
   TRẠNG THÁI ỨNG TUYỂN
   ============================================================ */
$myApp = $pdo->prepare("SELECT viec_lam_id, trang_thai FROM ung_tuyen WHERE sinh_vien_id=?");
$myApp->execute([$svId]);
$appliedIds = [];
$appliedStatus = [];
foreach ($myApp->fetchAll() as $row) {
    $appliedIds[] = (int)$row['viec_lam_id'];
    $appliedStatus[(int)$row['viec_lam_id']] = $row['trang_thai'];
}

json_out([
    'success' => true,
    'phu_hop' => $phuHop,
    'tat_ca' => $tatCa,
    'da_ung_tuyen' => $appliedIds,
    'trang_thai_ung_tuyen' => $appliedStatus,
]);