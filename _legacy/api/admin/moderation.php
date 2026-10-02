<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH TIN CẦN DUYỆT ============ */
if ($m === 'GET' && $action === 'pending') {
    $filter = $_GET['filter'] ?? 'all';
    $search = trim($_GET['q'] ?? '');

    $sql = "SELECT v.id, v.tieu_de, v.mo_ta, v.ky_nang_can, v.trang_thai,
                   v.luong_min, v.luong_max, v.created_at,
                   n.id AS ntd_id, n.ten_cong_ty,
                   kd.id AS kd_id, kd.hanh_dong AS kd_hanh_dong,
                   kd.diem_rui_ro, kd.tu_khoa_phat_hien, kd.ly_do
            FROM viec_lam v
            JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
            LEFT JOIN kiem_duyet_tin kd ON kd.viec_lam_id = v.id
            WHERE 1=1";
    $params = [];

    if ($filter === 'risky') $sql .= " AND (kd.diem_rui_ro >= 5 OR kd.id IS NULL)";
    elseif ($filter === 'warned') $sql .= " AND kd.hanh_dong = 'canh_bao'";
    elseif ($filter === 'blocked') $sql .= " AND kd.hanh_dong = 'chan'";

    if ($search) {
        $sql .= " AND (v.tieu_de LIKE ? OR n.ten_cong_ty LIKE ?)";
        $like = "%$search%";
        array_push($params, $like, $like);
    }

    $sql .= " ORDER BY v.created_at DESC LIMIT 200";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    $items = $st->fetchAll();

    foreach ($items as &$it) {
        if ($it['kd_id'] === null) {
            $risk = analyze_job_risk($pdo, $it['tieu_de'], $it['mo_ta'], '', $it['ky_nang_can'] ?? '');
            $it['diem_rui_ro'] = $risk['diem'];
            $it['tu_khoa_phat_hien'] = implode(', ', $risk['tu_khoa']);
            $it['goi_y'] = $risk['goi_y'];
        } else {
            $it['goi_y'] = $it['kd_hanh_dong'];
        }
    }
    json_out(['success'=>true, 'items'=>$items]);
}

/* ============ PHÂN TÍCH 1 TIN ============ */
if ($m === 'GET' && $action === 'analyze') {
    $jobId = (int)($_GET['job_id'] ?? 0);
    if (!$jobId) json_out(['success'=>false,'message'=>'Thiếu job_id']);

    $st = $pdo->prepare("SELECT v.*, n.ten_cong_ty FROM viec_lam v
        JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id WHERE v.id=?");
    $st->execute([$jobId]);
    $job = $st->fetch();
    if (!$job) json_out(['success'=>false,'message'=>'Không tìm thấy']);

    $risk = analyze_job_risk($pdo, $job['tieu_de'], $job['mo_ta'] ?? '',
                              $job['yeu_cau'] ?? '', $job['ky_nang_can'] ?? '');
    json_out(['success'=>true, 'job'=>$job, 'risk'=>$risk]);
}

/* ============ DUYỆT ============ */
if ($m === 'POST' && $action === 'approve') {
    $d = body();
    $jobId = (int)($d['viec_lam_id'] ?? 0);
    $note = trim($d['ly_do'] ?? '');
    if (!$jobId) json_out(['success'=>false,'message'=>'Thiếu viec_lam_id']);

    $pdo->prepare("INSERT INTO kiem_duyet_tin
        (viec_lam_id, admin_id, hanh_dong, ly_do, diem_rui_ro, tu_khoa_phat_hien)
        VALUES (?,?, 'duyet', ?, 0, '')")
        ->execute([$jobId, $admin, $note ?: 'Admin duyệt thủ công']);

    $pdo->prepare("UPDATE viec_lam SET trang_thai='dang_mo' WHERE id=?")->execute([$jobId]);

    $st = $pdo->prepare("SELECT nha_tuyen_dung_id, tieu_de FROM viec_lam WHERE id=?");
    $st->execute([$jobId]);
    $j = $st->fetch();
    if ($j) {
        $pdo->prepare("INSERT INTO thong_bao_ntd (nha_tuyen_dung_id, tieu_de, noi_dung, loai)
            VALUES (?,?,?,'success')")
            ->execute([$j['nha_tuyen_dung_id'], 'Tin việc đã được duyệt',
                'Tin "' . $j['tieu_de'] . '" đã được admin phê duyệt.']);
    }
    log_admin($pdo, $admin, 'approve_job', 'viec_lam', $jobId, $note);
    json_out(['success'=>true,'message'=>'Đã duyệt tin']);
}

/* ============ CHẶN ============ */
if ($m === 'POST' && $action === 'block') {
    $d = body();
    $jobId = (int)($d['viec_lam_id'] ?? 0);
    $reason = trim($d['ly_do'] ?? '');
    $score = (int)($d['diem_rui_ro'] ?? 10);
    $keywords = trim($d['tu_khoa'] ?? '');
    if (!$jobId || !$reason) json_out(['success'=>false,'message'=>'Thiếu thông tin']);

    $pdo->prepare("UPDATE viec_lam SET trang_thai='da_dong' WHERE id=?")->execute([$jobId]);
    $pdo->prepare("INSERT INTO kiem_duyet_tin
        (viec_lam_id, admin_id, hanh_dong, ly_do, diem_rui_ro, tu_khoa_phat_hien)
        VALUES (?,?, 'chan', ?, ?, ?)")
        ->execute([$jobId, $admin, $reason, $score, $keywords]);

    $st = $pdo->prepare("SELECT nha_tuyen_dung_id, tieu_de FROM viec_lam WHERE id=?");
    $st->execute([$jobId]);
    $j = $st->fetch();
    if ($j) {
        $pdo->prepare("INSERT INTO thong_bao_ntd (nha_tuyen_dung_id, tieu_de, noi_dung, loai)
            VALUES (?,?,?,'error')")
            ->execute([$j['nha_tuyen_dung_id'], 'Tin việc bị chặn',
                'Tin "' . $j['tieu_de'] . '" đã bị chặn. Lý do: ' . $reason]);
    }
    log_admin($pdo, $admin, 'block_job', 'viec_lam', $jobId, $reason);
    json_out(['success'=>true,'message'=>'Đã chặn tin']);
}

/* ============ CẢNH BÁO ============ */
if ($m === 'POST' && $action === 'warn') {
    $d = body();
    $jobId = (int)($d['viec_lam_id'] ?? 0);
    $reason = trim($d['ly_do'] ?? 'Nội dung có dấu hiệu không phù hợp');
    $score = (int)($d['diem_rui_ro'] ?? 5);
    $keywords = trim($d['tu_khoa'] ?? '');
    if (!$jobId) json_out(['success'=>false,'message'=>'Thiếu ID']);

    $pdo->prepare("INSERT INTO kiem_duyet_tin
        (viec_lam_id, admin_id, hanh_dong, ly_do, diem_rui_ro, tu_khoa_phat_hien)
        VALUES (?,?, 'canh_bao', ?, ?, ?)")
        ->execute([$jobId, $admin, $reason, $score, $keywords]);

    $st = $pdo->prepare("SELECT nha_tuyen_dung_id, tieu_de FROM viec_lam WHERE id=?");
    $st->execute([$jobId]);
    $j = $st->fetch();
    if ($j) {
        $pdo->prepare("INSERT INTO thong_bao_ntd (nha_tuyen_dung_id, tieu_de, noi_dung, loai)
            VALUES (?,?,?,'warning')")
            ->execute([$j['nha_tuyen_dung_id'], 'Cảnh báo tin việc',
                'Tin "' . $j['tieu_de'] . '" có dấu hiệu không phù hợp: ' . $reason]);
    }
    log_admin($pdo, $admin, 'warn_job', 'viec_lam', $jobId, $reason);
    json_out(['success'=>true,'message'=>'Đã gửi cảnh báo']);
}

/* ============ QUÉT TỰ ĐỘNG ============ */
if ($m === 'POST' && $action === 'auto-scan') {
    $st = $pdo->query("SELECT v.id, v.tieu_de, v.mo_ta, v.yeu_cau, v.ky_nang_can
        FROM viec_lam v
        LEFT JOIN kiem_duyet_tin kd ON kd.viec_lam_id = v.id
        WHERE kd.id IS NULL LIMIT 200");
    $jobs = $st->fetchAll();

    $blocked = 0; $warned = 0; $safe = 0;
    foreach ($jobs as $j) {
        $risk = analyze_job_risk($pdo, $j['tieu_de'], $j['mo_ta'] ?? '',
                                  $j['yeu_cau'] ?? '', $j['ky_nang_can'] ?? '');
        $act = 'duyet';
        if ($risk['goi_y'] === 'chan') {
            $act = 'chan';
            $pdo->prepare("UPDATE viec_lam SET trang_thai='da_dong' WHERE id=?")->execute([$j['id']]);
            $blocked++;
        } elseif ($risk['goi_y'] === 'canh_bao') {
            $act = 'canh_bao'; $warned++;
        } else { $safe++; }

        $pdo->prepare("INSERT INTO kiem_duyet_tin
            (viec_lam_id, admin_id, hanh_dong, ly_do, diem_rui_ro, tu_khoa_phat_hien)
            VALUES (?,?,?,?,?,?)")
            ->execute([$j['id'], $admin, $act, 'Quét tự động',
                $risk['diem'], implode(', ', $risk['tu_khoa'])]);
    }
    log_admin($pdo, $admin, 'auto_scan', null, null,
        "Chặn: $blocked, Cảnh báo: $warned, An toàn: $safe");
    json_out(['success'=>true,
        'message'=>"Đã quét ".count($jobs)." tin. Chặn: $blocked, Cảnh báo: $warned, An toàn: $safe"]);
}

/* ============ DANH SÁCH TỪ KHÓA ============ */
if ($m === 'GET' && $action === 'keywords') {
    $st = $pdo->query("SELECT id, tu_khoa, muc_do_rui_ro, hanh_dong, loai, ghi_chu, created_at
        FROM tu_khoa_cam
        ORDER BY hanh_dong DESC, muc_do_rui_ro DESC, tu_khoa");
    json_out(['success'=>true, 'items'=>$st->fetchAll()]);
}

/* ============ THÊM TỪ KHÓA ============ */
if ($m === 'POST' && $action === 'add-keyword') {
    $d = body();
    $kw = trim($d['tu_khoa'] ?? '');
    $score = (int)($d['muc_do_rui_ro'] ?? 5);
    $type = $d['loai'] ?? 'rui_ro';
    $hanhDong = $d['hanh_dong'] ?? 'chan';
    $ghiChu = trim($d['ghi_chu'] ?? '');

    if (!$kw) json_out(['success'=>false,'message'=>'Thiếu từ khóa']);
    if (!in_array($hanhDong, ['chan','canh_bao']))
        $hanhDong = 'chan';

    try {
        $pdo->prepare("INSERT INTO tu_khoa_cam (tu_khoa, muc_do_rui_ro, hanh_dong, loai, ghi_chu)
            VALUES (?,?,?,?,?)")
            ->execute([$kw, $score, $hanhDong, $type, $ghiChu]);

        log_admin($pdo, $admin, 'add_keyword', 'tu_khoa', $pdo->lastInsertId(),
            "Từ khóa: $kw ($hanhDong)");

        json_out(['success'=>true,'message'=>'Đã thêm từ khóa']);
    } catch (Exception $e) {
        json_out(['success'=>false,'message'=>'Từ khóa đã tồn tại']);
    }
}

/* ============ CẬP NHẬT TỪ KHÓA ============ */
if ($m === 'POST' && $action === 'update-keyword') {
    $d = body();
    $id = (int)($d['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);

    $fields = []; $vals = [];
    if (isset($d['tu_khoa'])) { $fields[] = 'tu_khoa=?'; $vals[] = trim($d['tu_khoa']); }
    if (isset($d['muc_do_rui_ro'])) { $fields[] = 'muc_do_rui_ro=?'; $vals[] = (int)$d['muc_do_rui_ro']; }
    if (isset($d['hanh_dong']) && in_array($d['hanh_dong'], ['chan','canh_bao'])) {
        $fields[] = 'hanh_dong=?'; $vals[] = $d['hanh_dong'];
    }
    if (isset($d['loai'])) { $fields[] = 'loai=?'; $vals[] = $d['loai']; }
    if (isset($d['ghi_chu'])) { $fields[] = 'ghi_chu=?'; $vals[] = trim($d['ghi_chu']); }

    if (empty($fields)) json_out(['success'=>false,'message'=>'Không có gì để cập nhật']);

    $vals[] = $id;
    $pdo->prepare("UPDATE tu_khoa_cam SET " . implode(', ', $fields) . " WHERE id=?")
        ->execute($vals);

    log_admin($pdo, $admin, 'update_keyword', 'tu_khoa', $id);
    json_out(['success'=>true,'message'=>'Đã cập nhật']);
}

if ($m === 'DELETE' && $action === 'delete-keyword') {
    $id = (int)($_GET['id'] ?? 0);
    $pdo->prepare("DELETE FROM tu_khoa_cam WHERE id=?")->execute([$id]);
    log_admin($pdo, $admin, 'delete_keyword', 'tu_khoa', $id);
    json_out(['success'=>true,'message'=>'Đã xóa']);
}

/* ============ THỐNG KÊ TỪ KHÓA ============ */
if ($m === 'GET' && $action === 'keywords-stats') {
    $st = $pdo->query("SELECT
        SUM(CASE WHEN hanh_dong='chan' THEN 1 ELSE 0 END) AS chan,
        SUM(CASE WHEN hanh_dong='canh_bao' THEN 1 ELSE 0 END) AS canh_bao,
        SUM(CASE WHEN loai='lua_dao' THEN 1 ELSE 0 END) AS lua_dao,
        SUM(CASE WHEN loai='rui_ro' THEN 1 ELSE 0 END) AS rui_ro,
        SUM(CASE WHEN loai='khong_phu_hop' THEN 1 ELSE 0 END) AS khong_phu_hop,
        COUNT(*) AS tong
        FROM tu_khoa_cam");
    json_out(['success'=>true, 'stats'=>$st->fetch()]);
}