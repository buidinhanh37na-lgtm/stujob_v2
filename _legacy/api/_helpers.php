<?php
if (session_status() === PHP_SESSION_NONE) session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

function json_out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function body() {
    $raw = file_get_contents('php://input');
    $j = json_decode($raw, true);
    return is_array($j) ? $j : $_POST;
}
function require_login() {
    if (empty($_SESSION['sinh_vien_id'])) {
        json_out(['success'=>false,'message'=>'Chưa đăng nhập'], 401);
    }
    return (int)$_SESSION['sinh_vien_id'];
}
function vn_date($d) {
    if (!$d) return '';
    return date('d/m/Y', strtotime($d));
}

/* ============================================================
   HELPERS CHUNG — EMPLOYER + ADMIN
   ============================================================ */

/* ---------- 1. CHO EMPLOYER ---------- */

/** Yêu cầu đăng nhập NTD */
if (!function_exists('require_employer')) {
    function require_employer() {
        if (empty($_SESSION['nha_tuyen_dung_id'])) {
            json_out(['success'=>false,'message'=>'Chưa đăng nhập NTD'], 401);
        }
        return (int)$_SESSION['nha_tuyen_dung_id'];
    }
}

/** Khoảng cách Haversine (km) */
if (!function_exists('calc_distance_km')) {
    function calc_distance_km($lat1, $lon1, $lat2, $lon2) {
        if (!$lat1 || !$lon1 || !$lat2 || !$lon2) return null;
        $R = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat/2)**2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2)**2;
        return round($R * 2 * atan2(sqrt($a), sqrt(1-$a)), 2);
    }
}

/** Lưu thông báo cho SV */
if (!function_exists('save_sv_notification')) {
    function save_sv_notification($pdo, $svId, $title, $content, $type = 'info') {
        $pdo->prepare("INSERT INTO thong_bao (sinh_vien_id, tieu_de, noi_dung, loai)
                       VALUES (?,?,?,?)")->execute([$svId, $title, $content, $type]);
    }
}

/** Lưu thông báo cho NTD */
if (!function_exists('save_ntd_notification')) {
    function save_ntd_notification($pdo, $ntdId, $title, $content, $type = 'info') {
        $pdo->prepare("INSERT INTO thong_bao_ntd (nha_tuyen_dung_id, tieu_de, noi_dung, loai)
                       VALUES (?,?,?,?)")->execute([$ntdId, $title, $content, $type]);
    }
}

/* ---------- 2. CHO ADMIN ---------- */

/** Yêu cầu đăng nhập admin */
if (!function_exists('require_admin')) {
    function require_admin() {
        if (empty($_SESSION['admin_id'])) {
            json_out(['success'=>false,'message'=>'Chưa đăng nhập admin'], 401);
        }
        return (int)$_SESSION['admin_id'];
    }
}

/** Alias của json_out cho code mới (dùng camelCase) */
if (!function_exists('jsonOut')) {
    function jsonOut($data, $code = 200) {
        return json_out($data, $code);
    }
}

/* ============================================================
   HÀM LƯU THÔNG BÁO CHUNG (dùng cho mọi module)
   ============================================================ */

if (!function_exists('save_notification')) {
    /**
     * Lưu thông báo cho sinh viên
     * @param PDO    $pdo
     * @param int    $svId     ID sinh viên nhận
     * @param string $title    Tiêu đề
     * @param string $content  Nội dung
     * @param string $type     Loại: success | info | warning | error
     */
    function save_notification($pdo, $svId, $title, $content, $type = 'info') {
        $pdo->prepare("INSERT INTO thong_bao (sinh_vien_id, tieu_de, noi_dung, loai)
                       VALUES (?,?,?,?)")
            ->execute([$svId, $title, $content, $type]);
    }
}

if (!function_exists('save_notification_ntd')) {
    /** Lưu thông báo cho nhà tuyển dụng */
    function save_notification_ntd($pdo, $ntdId, $title, $content, $type = 'info') {
        $pdo->prepare("INSERT INTO thong_bao_ntd (nha_tuyen_dung_id, tieu_de, noi_dung, loai)
                       VALUES (?,?,?,?)")
            ->execute([$ntdId, $title, $content, $type]);
    }
}

/* ============================================================
   PHÍ DỊCH VỤ SINH VIÊN — 3% sau 10 đơn hoàn thành
   ============================================================ */
if (!function_exists('calc_sv_fee')) {
    /**
     * Tính phí dịch vụ SV
     * @param PDO $pdo
     * @param int $svId       ID sinh viên
     * @param float $salary   Thù lao
     * @return array ['fee' => float, 'completed_count' => int, 'is_free' => bool]
     */
    function calc_sv_fee($pdo, $svId, $salary) {
        // Đếm số nhiệm vụ SV đã hoàn thành (TRƯỚC đơn này)
        $st = $pdo->prepare("SELECT COUNT(*) FROM nhiem_vu
            WHERE sinh_vien_id = ? AND trang_thai = 'hoan_thanh'");
        $st->execute([$svId]);
        $completedCount = (int)$st->fetchColumn();

        // 10 đơn đầu → miễn phí
        if ($completedCount < 10) {
            return [
                'fee' => 0,
                'completed_count' => $completedCount,
                'is_free' => true,
                'next_free' => 10 - $completedCount
            ];
        }

        // Từ đơn 11 trở đi → 3%
        $fee = round($salary * 0.03);
        return [
            'fee' => $fee,
            'completed_count' => $completedCount,
            'is_free' => false,
            'next_free' => 0
        ];
    }
}