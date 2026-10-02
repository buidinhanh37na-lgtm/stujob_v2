<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH ============ */
if ($m === 'GET' && $action === 'list') {
    $search = trim($_GET['q'] ?? '');
    $status = $_GET['status'] ?? 'all';
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 30;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT st.*,
        (SELECT COUNT(*) FROM sinh_vien sv WHERE sv.ma_sinh_vien = st.ma_sinh_vien) AS da_dang_ky
        FROM sv_truong st WHERE 1=1";
    $params = [];

    if ($status !== 'all') { $sql .= " AND st.trang_thai=?"; $params[] = $status; }
    if ($search) {
        $sql .= " AND (st.ma_sinh_vien LIKE ? OR st.ho_ten LIKE ? OR st.chuyen_nganh LIKE ?)";
        $like = "%$search%";
        array_push($params, $like, $like, $like);
    }

    $sql .= " ORDER BY st.created_at DESC LIMIT $limit OFFSET $offset";
    $st = $pdo->prepare($sql);
    $st->execute($params);
    json_out(['success'=>true, 'items'=>$st->fetchAll(), 'page'=>$page]);
}

/* ============ THÊM ============ */
if ($m === 'POST' && $action === 'add') {
    $d = body();
    $mssv = trim($d['ma_sinh_vien'] ?? '');
    $name = trim($d['ho_ten'] ?? '');
    if (!$mssv || !$name) json_out(['success'=>false,'message'=>'Thiếu MSSV hoặc họ tên']);

    try {
        $pdo->prepare("INSERT INTO sv_truong
            (ma_sinh_vien, ho_ten, ngay_sinh, khoa, chuyen_nganh, nam_hoc, lop, trang_thai)
            VALUES (?,?,?,?,?,?,?,?)")
            ->execute([
                $mssv, $name,
                !empty($d['ngay_sinh']) ? $d['ngay_sinh'] : null,
                $d['khoa'] ?? null,
                $d['chuyen_nganh'] ?? null,
                !empty($d['nam_hoc']) ? (int)$d['nam_hoc'] : null,
                $d['lop'] ?? null,
                $d['trang_thai'] ?? 'dang_hoc'
            ]);
        log_admin($pdo, $admin, 'add_sv_truong', 'sv_truong', $pdo->lastInsertId(), $mssv);
        json_out(['success'=>true,'message'=>'Đã thêm sinh viên']);
    } catch (Exception $e) {
        json_out(['success'=>false,'message'=>'MSSV đã tồn tại']);
    }
}

/* ============ IMPORT CSV ============ */
if ($m === 'POST' && $action === 'import') {
    if (!isset($_FILES['file'])) json_out(['success'=>false,'message'=>'Thiếu file']);

    $fh = fopen($_FILES['file']['tmp_name'], 'r');
    if (!$fh) json_out(['success'=>false,'message'=>'Không đọc được file']);

    $bom = fread($fh, 3);
    if ($bom !== "\xEF\xBB\xBF") rewind($fh);

    fgetcsv($fh); // bỏ header
    $success = 0; $failed = 0;

    $ins = $pdo->prepare("INSERT INTO sv_truong
        (ma_sinh_vien, ho_ten, ngay_sinh, khoa, chuyen_nganh, nam_hoc, lop, trang_thai)
        VALUES (?,?,?,?,?,?,?,?)
        ON DUPLICATE KEY UPDATE
        ho_ten=VALUES(ho_ten), chuyen_nganh=VALUES(chuyen_nganh),
        nam_hoc=VALUES(nam_hoc), lop=VALUES(lop), trang_thai=VALUES(trang_thai)");

    while (($r = fgetcsv($fh)) !== false) {
        if (count($r) < 2) continue;
        try {
            $ins->execute([
                trim($r[0]), trim($r[1]),
                !empty($r[2]) ? $r[2] : null,
                $r[3] ?? null,
                $r[4] ?? null,
                !empty($r[5]) ? (int)$r[5] : null,
                $r[6] ?? null,
                $r[7] ?? 'dang_hoc'
            ]);
            $success++;
        } catch (Exception $e) { $failed++; }
    }
    fclose($fh);

    log_admin($pdo, $admin, 'import_sv_truong', null, null, "$success thành công, $failed thất bại");
    json_out(['success'=>true, 'message'=>"Import xong: $success thành công, $failed thất bại"]);
}

/* ============ XÓA ============ */
if ($m === 'DELETE' && $action === 'delete') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_out(['success'=>false,'message'=>'Thiếu ID']);
    $pdo->prepare("DELETE FROM sv_truong WHERE id=?")->execute([$id]);
    log_admin($pdo, $admin, 'delete_sv_truong', 'sv_truong', $id);
    json_out(['success'=>true, 'message'=>'Đã xóa']);
}