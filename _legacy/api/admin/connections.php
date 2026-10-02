<?php
require_once __DIR__ . '/_helpers-admin.php';
require_admin();

$action = $_GET['action'] ?? 'list';

/* ============================================================
   DANH SÁCH KẾT NỐI THÀNH CÔNG
   ============================================================ */
if ($action === 'list') {
    $status = $_GET['status'] ?? 'all';  // all | da_chap_nhan | hoan_thanh
    $search = trim($_GET['q'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 30;
    $offset = ($page - 1) * $limit;

    $sql = "SELECT ut.id, ut.trang_thai, ut.created_at,
                   sv.id AS sinh_vien_id, sv.ho_ten AS sv_ten, sv.ma_sinh_vien,
                   sv.truong, sv.diem_danh_gia, sv.so_lan_danh_gia,
                   v.id AS viec_lam_id, v.tieu_de, v.luong_min, v.luong_max,
                   v.loai_cong_viec,
                   n.id AS ntd_id, n.ten_cong_ty, n.loai AS ntd_loai,
                   n.logo,
                   bd.so_tien AS escrow_tien, bd.trang_thai AS escrow_trang_thai,
                   bd.ngay_giai_ngan,
                   dg.diem AS danh_gia_diem, dg.nhan_xet AS danh_gia_nhan_xet
            FROM ung_tuyen ut
            JOIN sinh_vien sv ON sv.id = ut.sinh_vien_id
            JOIN viec_lam v ON v.id = ut.viec_lam_id
            JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
            LEFT JOIN bao_dam_thanh_toan bd ON bd.viec_lam_id = v.id AND bd.sinh_vien_id = sv.id
            LEFT JOIN danh_gia dg ON dg.viec_lam_id = v.id AND dg.sinh_vien_id = sv.id AND dg.nha_tuyen_dung_id = n.id
            WHERE ut.trang_thai IN ('da_chap_nhan', 'hoan_thanh')";
    $params = [];

    if ($status !== 'all') {
        $sql .= " AND ut.trang_thai = ?";
        $params[] = $status;
    }
    if ($search) {
        $sql .= " AND (sv.ho_ten LIKE ? OR sv.ma_sinh_vien LIKE ? OR n.ten_cong_ty LIKE ? OR v.tieu_de LIKE ?)";
        $like = "%$search%";
        array_push($params, $like, $like, $like, $like);
    }

    $sql .= " ORDER BY ut.created_at DESC LIMIT $limit OFFSET $offset";

    $st = $pdo->prepare($sql);
    $st->execute($params);
    $items = $st->fetchAll();

    // Đếm tổng
    $countSql = "SELECT COUNT(*) FROM ung_tuyen ut
                 JOIN sinh_vien sv ON sv.id = ut.sinh_vien_id
                 JOIN viec_lam v ON v.id = ut.viec_lam_id
                 JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
                 WHERE ut.trang_thai IN ('da_chap_nhan', 'hoan_thanh')";
    $countParams = [];
    if ($status !== 'all') { $countSql .= " AND ut.trang_thai = ?"; $countParams[] = $status; }
    if ($search) {
        $countSql .= " AND (sv.ho_ten LIKE ? OR sv.ma_sinh_vien LIKE ? OR n.ten_cong_ty LIKE ? OR v.tieu_de LIKE ?)";
        $like = "%$search%";
        array_push($countParams, $like, $like, $like, $like);
    }
    $countSt = $pdo->prepare($countSql);
    $countSt->execute($countParams);
    $total = (int)$countSt->fetchColumn();

    json_out([
        'success' => true,
        'items' => $items,
        'total' => $total,
        'page' => $page,
        'total_pages' => ceil($total / $limit)
    ]);
}

/* ============================================================
   THỐNG KÊ
   ============================================================ */
if ($action === 'stats') {
    $st = $pdo->query("SELECT
        SUM(CASE WHEN ut.trang_thai='da_chap_nhan' THEN 1 ELSE 0 END) AS dang_lam,
        SUM(CASE WHEN ut.trang_thai='hoan_thanh' THEN 1 ELSE 0 END) AS hoan_thanh,
        COUNT(*) AS tong
        FROM ung_tuyen ut
        WHERE ut.trang_thai IN ('da_chap_nhan','hoan_thanh')");
    $stats = $st->fetch();

    // Tổng tiền đã giải ngân từ các kết nối
    $money = $pdo->query("SELECT IFNULL(SUM(so_tien),0) FROM bao_dam_thanh_toan WHERE trang_thai='da_giai_ngan'")->fetchColumn();

    // Số NTD có kết nối
    $ntdCount = $pdo->query("SELECT COUNT(DISTINCT v.nha_tuyen_dung_id)
        FROM ung_tuyen ut
        JOIN viec_lam v ON v.id = ut.viec_lam_id
        WHERE ut.trang_thai IN ('da_chap_nhan','hoan_thanh')")->fetchColumn();

    // Số SV có kết nối
    $svCount = $pdo->query("SELECT COUNT(DISTINCT ut.sinh_vien_id)
        FROM ung_tuyen ut
        WHERE ut.trang_thai IN ('da_chap_nhan','hoan_thanh')")->fetchColumn();

    json_out([
        'success' => true,
        'stats' => $stats,
        'money' => (float)$money,
        'ntd_count' => (int)$ntdCount,
        'sv_count' => (int)$svCount
    ]);
}

/* ============================================================
   CHI TIẾT 1 KẾT NỐI
   ============================================================ */
if ($action === 'detail') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id) json_out(['success' => false, 'message' => 'Thiếu ID']);

    $st = $pdo->prepare("SELECT ut.*,
        sv.ho_ten AS sv_ten, sv.ma_sinh_vien, sv.truong, sv.chuyen_nganh, sv.gpa,
        n.ten_cong_ty, n.loai AS ntd_loai, n.email AS ntd_email,
        v.tieu_de, v.mo_ta, v.luong_min, v.luong_max, v.loai_cong_viec,
        bd.so_tien, bd.trang_thai AS escrow_trang_thai, bd.ngay_giai_ngan
        FROM ung_tuyen ut
        JOIN sinh_vien sv ON sv.id = ut.sinh_vien_id
        JOIN viec_lam v ON v.id = ut.viec_lam_id
        JOIN nha_tuyen_dung n ON n.id = v.nha_tuyen_dung_id
        LEFT JOIN bao_dam_thanh_toan bd ON bd.viec_lam_id = v.id AND bd.sinh_vien_id = sv.id
        WHERE ut.id = ?");
    $st->execute([$id]);
    $item = $st->fetch();
    if (!$item) json_out(['success' => false, 'message' => 'Không tìm thấy']);

    json_out(['success' => true, 'item' => $item]);
}

json_out(['success' => false, 'message' => 'Action không hợp lệ']);