<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ DANH SÁCH ============ */
if ($m === 'GET' && $action === 'list') {
    $search = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT ls.*,
        CASE
            WHEN ls.nguoi_nhan_loai='sinh_vien' THEN (SELECT ho_ten FROM sinh_vien WHERE id=ls.nguoi_nhan_id)
            WHEN ls.nguoi_nhan_loai='nha_tuyen_dung' THEN (SELECT ten_cong_ty FROM nha_tuyen_dung WHERE id=ls.nguoi_nhan_id)
        END AS nguoi_nhan_ten,
        a.ho_ten AS admin_name,
        kn.tieu_de AS ten_khieu_nai
        FROM lich_su_hoan_tien ls
        LEFT JOIN quan_tri_vien a ON a.id = ls.admin_id
        LEFT JOIN khieu_nai kn ON kn.id = ls.khieu_nai_id
        WHERE 1=1";
    $params = [];

    if ($search) {
        $sql .= " AND ls.ly_do LIKE ?";
        $params[] = "%$search%";
    }

    $sql .= " ORDER BY ls.created_at DESC LIMIT $limit OFFSET $offset";
    $st = $pdo->prepare($sql);
    $st->execute($params);

    json_out(['success'=>true, 'items'=>$st->fetchAll(), 'page'=>$page]);
}

/* ============ TẠO THỦ CÔNG ============ */
if ($m === 'POST' && $action === 'create') {
    $d = body();
    $nguoiNhanLoai = $d['nguoi_nhan_loai'] ?? '';
    $nguoiNhanId = (int)($d['nguoi_nhan_id'] ?? 0);
    $soTien = (float)($d['so_tien'] ?? 0);
    $lyDo = trim($d['ly_do'] ?? '');
    $khieuNaiId = !empty($d['khieu_nai_id']) ? (int)$d['khieu_nai_id'] : null;
    $baoDamId = !empty($d['bao_dam_id']) ? (int)$d['bao_dam_id'] : null;

    if (!in_array($nguoiNhanLoai, ['sinh_vien','nha_tuyen_dung']))
        json_out(['success'=>false,'message'=>'Loại người nhận không hợp lệ']);
    if (!$nguoiNhanId || $soTien <= 0)
        json_out(['success'=>false,'message'=>'Số tiền không hợp lệ']);
    if (!$lyDo) json_out(['success'=>false,'message'=>'Thiếu lý do']);

    $pdo->beginTransaction();
    try {
        if ($nguoiNhanLoai === 'sinh_vien') {
            $pdo->prepare("INSERT IGNORE INTO vi_tien (sinh_vien_id, so_du) VALUES (?, 0)")
                ->execute([$nguoiNhanId]);
            $pdo->prepare("UPDATE vi_tien SET so_du = so_du + ? WHERE sinh_vien_id=?")
                ->execute([$soTien, $nguoiNhanId]);
            $pdo->prepare("INSERT INTO giao_dich (sinh_vien_id, so_tien, loai, mo_ta, trang_thai)
                VALUES (?,?, 'thu_nhap', ?, 'thanh_cong')")
                ->execute([$nguoiNhanId, $soTien, $lyDo]);
        } else {
            $pdo->prepare("INSERT IGNORE INTO vi_ntd (nha_tuyen_dung_id, so_du) VALUES (?, 0)")
                ->execute([$nguoiNhanId]);
            $pdo->prepare("UPDATE vi_ntd SET so_du = so_du + ? WHERE nha_tuyen_dung_id=?")
                ->execute([$soTien, $nguoiNhanId]);
        }

        $pdo->prepare("INSERT INTO lich_su_hoan_tien
            (khieu_nai_id, bao_dam_id, nguoi_nhan_loai, nguoi_nhan_id, so_tien, ly_do, admin_id)
            VALUES (?,?,?,?,?,?,?)")
            ->execute([$khieuNaiId, $baoDamId, $nguoiNhanLoai, $nguoiNhanId, $soTien, $lyDo, $admin]);

        log_admin($pdo, $admin, 'create_refund', $nguoiNhanLoai, $nguoiNhanId,
            "Hoàn: $soTien. Lý do: $lyDo");

        $pdo->commit();
        json_out(['success'=>true,'message'=>'Đã tạo hoàn tiền']);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_out(['success'=>false,'message'=>'Lỗi: ' . $e->getMessage()]);
    }
}

/* ============ STATS ============ */
if ($m === 'GET' && $action === 'stats') {
    $tong = 0; $choSV = 0; $choNTD = 0; $soLan = 0;
    try {
        $st = $pdo->query("SELECT
            IFNULL(SUM(so_tien),0) AS tong,
            IFNULL(SUM(CASE WHEN nguoi_nhan_loai='sinh_vien' THEN so_tien ELSE 0 END),0) AS cho_sv,
            IFNULL(SUM(CASE WHEN nguoi_nhan_loai='nha_tuyen_dung' THEN so_tien ELSE 0 END),0) AS cho_ntd,
            COUNT(*) AS so_lan
            FROM lich_su_hoan_tien");
        $r = $st->fetch();
        $tong = (float)$r['tong'];
        $choSV = (float)$r['cho_sv'];
        $choNTD = (float)$r['cho_ntd'];
        $soLan = (int)$r['so_lan'];
    } catch (Exception $e) {}

    $escrowHold = 0;
    try {
        $escrowHold = (float)$pdo->query("SELECT IFNULL(SUM(so_tien),0)
            FROM bao_dam_thanh_toan WHERE trang_thai IN ('da_nap','cho_nghiem_thu')")->fetchColumn();
    } catch (Exception $e) {}

    json_out([
        'success'=>true,
        'tong_hoan'=>$tong,
        'cho_sv'=>$choSV,
        'cho_ntd'=>$choNTD,
        'so_lan'=>$soLan,
        'escrow_dang_giu'=>$escrowHold
    ]);
}