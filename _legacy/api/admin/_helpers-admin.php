<?php
require_once __DIR__ . '/../_helpers.php';
require_once __DIR__ . '/../../config/database.php';

/* ============================================================
   HELPERS CHO ADMIN
   ============================================================ */

if (!function_exists('require_admin')) {
    function require_admin() {
        if (empty($_SESSION['admin_id'])) {
            json_out(['success'=>false,'message'=>'Chưa đăng nhập admin'], 401);
        }
        return (int)$_SESSION['admin_id'];
    }
}

if (!function_exists('current_admin')) {
    function current_admin($pdo) {
        $id = require_admin();
        $st = $pdo->prepare("SELECT id,ho_ten,email,vai_tro,trang_thai FROM quan_tri_vien WHERE id=?");
        $st->execute([$id]);
        $a = $st->fetch();
        if (!$a || $a['trang_thai'] !== 'hoat_dong') {
            json_out(['success'=>false,'message'=>'Tài khoản không hợp lệ'], 401);
        }
        return $a;
    }
}

if (!function_exists('require_role')) {
    function require_role($pdo, $roles = []) {
        $admin = current_admin($pdo);
        if (!in_array($admin['vai_tro'], $roles)) {
            json_out(['success'=>false,'message'=>'Không đủ quyền'], 403);
        }
        return $admin;
    }
}

if (!function_exists('log_admin')) {
    function log_admin($pdo, $adminId, $action, $targetType = null, $targetId = null, $detail = null) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? null;
        $pdo->prepare("INSERT INTO nhat_ky_admin
            (admin_id, hanh_dong, doi_tuong_loai, doi_tuong_id, chi_tiet, ip)
            VALUES (?,?,?,?,?,?)")
            ->execute([$adminId, $action, $targetType, $targetId, $detail, $ip]);
    }
}

if (!function_exists('notify_admin')) {
    function notify_admin($pdo, $adminId, $title, $content, $type = 'info') {
        $pdo->prepare("INSERT INTO thong_bao_admin (admin_id, tieu_de, noi_dung, loai)
            VALUES (?,?,?,?)")->execute([$adminId, $title, $content, $type]);
    }
}

if (!function_exists('get_config')) {
    function get_config($pdo, $key, $default = null) {
        $st = $pdo->prepare("SELECT gia_tri FROM cau_hinh_he_thong WHERE khoa=?");
        $st->execute([$key]);
        $v = $st->fetchColumn();
        return $v === false ? $default : $v;
    }
}

if (!function_exists('get_all_config')) {
    function get_all_config($pdo) {
        $st = $pdo->query("SELECT khoa, gia_tri, mo_ta FROM cau_hinh_he_thong");
        $rows = $st->fetchAll();
        $out = [];
        foreach ($rows as $r) $out[$r['khoa']] = $r;
        return $out;
    }
}

if (!function_exists('set_config')) {
    function set_config($pdo, $key, $value, $desc = null) {
        $pdo->prepare("INSERT INTO cau_hinh_he_thong (khoa, gia_tri, mo_ta)
            VALUES (?,?,?)
            ON DUPLICATE KEY UPDATE gia_tri=VALUES(gia_tri), mo_ta=COALESCE(VALUES(mo_ta), mo_ta)")
            ->execute([$key, $value, $desc]);
    }
}

if (!function_exists('analyze_job_risk')) {
    function analyze_job_risk($pdo, $title, $desc, $requirements, $skills) {
        $text = mb_strtolower($title . ' ' . $desc . ' ' . $requirements . ' ' . $skills);
        $st = $pdo->query("SELECT tu_khoa, muc_do_rui_ro, loai FROM tu_khoa_cam");
        $keywords = $st->fetchAll();
        $found = [];
        $maxScore = 0;
        foreach ($keywords as $kw) {
            if (mb_strpos($text, mb_strtolower($kw['tu_khoa'])) !== false) {
                $found[] = $kw['tu_khoa'] . '(' . $kw['muc_do_rui_ro'] . ')';
                $maxScore = max($maxScore, (int)$kw['muc_do_rui_ro']);
            }
        }
        $score = min(10, $maxScore + min(3, count($found) - 1));
        $ngChan = (int)get_config($pdo, 'nguong_rui_ro_tu_dong_chan', 8);
        $ngCanhBao = (int)get_config($pdo, 'nguong_rui_ro_canh_bao', 5);
        $goiY = 'duyet';
        if ($score >= $ngChan) $goiY = 'chan';
        elseif ($score >= $ngCanhBao) $goiY = 'canh_bao';
        return [
            'diem'=>$score, 'tu_khoa'=>$found, 'goi_y'=>$goiY,
            'nguong_chan'=>$ngChan, 'nguong_canh_bao'=>$ngCanhBao
        ];
    }
}

if (!function_exists('get_entity_name')) {
    function get_entity_name($pdo, $type, $id) {
        if ($type === 'sinh_vien') {
            $st = $pdo->prepare("SELECT ho_ten FROM sinh_vien WHERE id=?");
        } elseif ($type === 'nha_tuyen_dung') {
            $st = $pdo->prepare("SELECT ten_cong_ty FROM nha_tuyen_dung WHERE id=?");
        } else {
            return "Hệ thống";
        }
        $st->execute([$id]);
        return $st->fetchColumn() ?: "(Không rõ)";
    }
}