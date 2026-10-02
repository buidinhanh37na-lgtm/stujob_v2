<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();

// Vị trí NTD
$st = $pdo->prepare("SELECT vi_do, kinh_do FROM nha_tuyen_dung WHERE id=?");
$st->execute([$ntdId]);
$pos = $st->fetch();

$categoryId = (int)($_GET['nhom_viec_id'] ?? 0);
$radius = (float)($_GET['ban_kinh'] ?? 0);
$sortBy = $_GET['sap_xep'] ?? 'phu_hop';

// Kỹ năng yêu cầu
if ($categoryId) {
    $q = $pdo->prepare("SELECT ky_nang_can FROM viec_lam WHERE nha_tuyen_dung_id=? AND nhom_viec_id=?");
    $q->execute([$ntdId, $categoryId]);
} else {
    $q = $pdo->prepare("SELECT ky_nang_can FROM viec_lam WHERE nha_tuyen_dung_id=?");
    $q->execute([$ntdId]);
}
$jobs = $q->fetchAll();

$requiredSkills = [];
foreach ($jobs as $j) {
    foreach (explode(',', $j['ky_nang_can'] ?? '') as $s) {
        $s = trim($s);
        if ($s) $requiredSkills[$s] = true;
    }
}
$requiredSkills = array_keys($requiredSkills);

// Tất cả SV
$students = $pdo->query("SELECT id, ma_sinh_vien, ho_ten, truong, khoa, chuyen_nganh,
    nam_hoc, gpa, mo_ta, diem_danh_gia, so_lan_danh_gia, anh_dai_dien, vi_do, kinh_do
    FROM sinh_vien")->fetchAll();

$skillStmt = $pdo->prepare("SELECT ten_ky_nang, muc_do FROM ky_nang WHERE sinh_vien_id=?");

$result = [];
foreach ($students as $sv) {
    $skillStmt->execute([$sv['id']]);
    $svSkills = $skillStmt->fetchAll();
    $svSkillNames = array_map(fn($k) => mb_strtolower($k['ten_ky_nang']), $svSkills);

    // Điểm kỹ năng (40)
    $matchScore = 0;
    if (count($requiredSkills) > 0) {
        $match = 0;
        foreach ($requiredSkills as $r) {
            foreach ($svSkillNames as $k) {
                if (mb_stripos($k, $r) !== false || mb_stripos($r, $k) !== false) { $match++; break; }
            }
        }
        $matchScore = ($match / count($requiredSkills)) * 40;
    } else {
        $matchScore = min(40, count($svSkills) * 10);
    }

    // GPA (25)
    $gpaScore = ((float)$sv['gpa'] / 4.0) * 25;

    // Rating (25)
    $ratingScore = $sv['so_lan_danh_gia'] > 0
        ? ((float)$sv['diem_danh_gia'] / 5.0) * 25
        : 15;

    // Khoảng cách (10)
    $distanceScore = 5;
    $distance = null;
    if ($pos['vi_do'] && $pos['kinh_do'] && $sv['vi_do'] && $sv['kinh_do']) {
        $distance = calc_distance_km((float)$pos['vi_do'], (float)$pos['kinh_do'],
                                      (float)$sv['vi_do'], (float)$sv['kinh_do']);
        $distanceScore = max(0, 10 - ($distance / 5));
    }
    if ($radius > 0 && ($distance == null || $distance > $radius)) continue;

    $total = round($matchScore + $gpaScore + $ratingScore + $distanceScore, 1);

    $result[] = [
        'id' => $sv['id'],
        'ma_sinh_vien' => $sv['ma_sinh_vien'],
        'ho_ten' => $sv['ho_ten'],
        'truong' => $sv['truong'],
        'chuyen_nganh' => $sv['chuyen_nganh'],
        'khoa' => $sv['khoa'],
        'nam_hoc' => $sv['nam_hoc'],
        'gpa' => $sv['gpa'],
        'diem_danh_gia' => $sv['diem_danh_gia'],
        'so_lan_danh_gia' => $sv['so_lan_danh_gia'],
        'anh_dai_dien' => $sv['anh_dai_dien'],
        'ky_nang' => array_map(fn($k) => $k['ten_ky_nang'], $svSkills),
        'diem_phu_hop' => $total,
        'khoang_cach' => $distance,
        'mo_ta' => $sv['mo_ta'],
    ];
}

usort($result, function($a, $b) use ($sortBy) {
    if ($sortBy === 'khoang_cach') return ($a['khoang_cach'] ?? 99999) <=> ($b['khoang_cach'] ?? 99999);
    if ($sortBy === 'danh_gia') return $b['diem_danh_gia'] <=> $a['diem_danh_gia'];
    return $b['diem_phu_hop'] <=> $a['diem_phu_hop'];
});

json_out(['success'=>true,'items'=>array_slice($result, 0, 50)]);