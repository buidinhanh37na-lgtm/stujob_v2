<?php
require_once __DIR__ . '/_helpers-admin.php';
require_admin();

$range = $_GET['range'] ?? '30d';
$days = $range === '7d' ? 7 : ($range === '90d' ? 90 : 30);

/* ============ TỔNG QUAN ============ */
$totalSV = (int)$pdo->query("SELECT COUNT(*) FROM sinh_vien")->fetchColumn();
$totalNTD = (int)$pdo->query("SELECT COUNT(*) FROM nha_tuyen_dung")->fetchColumn();
$totalJobs = (int)$pdo->query("SELECT COUNT(*) FROM viec_lam")->fetchColumn();
$totalApps = (int)$pdo->query("SELECT COUNT(*) FROM ung_tuyen")->fetchColumn();

/* ============ TỶ LỆ GHÉP VIỆC ============ */
$matched = (int)$pdo->query("SELECT COUNT(*) FROM ung_tuyen
    WHERE trang_thai IN ('da_chap_nhan','hoan_thanh')")->fetchColumn();
$totalValid = (int)$pdo->query("SELECT COUNT(*) FROM ung_tuyen
    WHERE trang_thai IN ('da_chap_nhan','hoan_thanh','tu_choi')")->fetchColumn();
$matchRate = $totalValid > 0 ? round($matched / $totalValid * 100, 1) : 0;

/* ============ ESCROW ============ */
$escrowStats = $pdo->query("SELECT
    IFNULL(SUM(CASE WHEN trang_thai IN ('cho_nap','cho_ky_quy') THEN so_tien ELSE 0 END),0) AS cho_ky_quy,
    IFNULL(SUM(CASE WHEN trang_thai IN ('da_nap','da_ky_quy','cho_nghiem_thu') THEN so_tien ELSE 0 END),0) AS dang_giu,
    IFNULL(SUM(CASE WHEN trang_thai='da_giai_ngan' THEN so_tien ELSE 0 END),0) AS da_giai_ngan,
    IFNULL(SUM(CASE WHEN trang_thai='hoan_tien' THEN so_tien ELSE 0 END),0) AS da_hoan
    FROM bao_dam_thanh_toan")->fetch();

/* ============ DOANH THU ============ */
$revenue = $pdo->query("SELECT
    IFNULL(SUM(phi_dich_vu),0) AS tong_phi,
    COUNT(*) AS so_gd
    FROM bao_dam_thanh_toan WHERE trang_thai='da_giai_ngan'")->fetch();

// Doanh thu từ SV (3% phí)
$revenueSV = $pdo->query("SELECT
    IFNULL(SUM(phi_san),0) AS tong_phi_sv,
    COUNT(*) AS so_gd
    FROM giao_dich WHERE loai='thu_nhap' AND phi_san > 0")->fetch();

/* ============ VÍ ============ */
$walletNTD = (float)$pdo->query("SELECT IFNULL(SUM(so_du),0) FROM vi_ntd")->fetchColumn();
$walletSV = 0;
try {
    $walletSV = (float)$pdo->query("SELECT IFNULL(SUM(so_du),0) FROM vi_tien")->fetchColumn();
} catch (Exception $e) {}

/* ============ CHART ============ */
$chart = [];
for ($i = $days - 1; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $q = $pdo->prepare("SELECT
        IFNULL(SUM(CASE WHEN trang_thai='da_giai_ngan' THEN so_tien ELSE 0 END),0) AS giai_ngan,
        IFNULL(SUM(CASE WHEN trang_thai='da_nap' THEN so_tien ELSE 0 END),0) AS nap_vao,
        IFNULL(SUM(phi_dich_vu),0) AS phi
        FROM bao_dam_thanh_toan WHERE DATE(created_at)=?");
    $q->execute([$date]);
    $r = $q->fetch();
    $chart[] = [
        'date' => date('d/m', strtotime($date)),
        'giai_ngan' => (float)$r['giai_ngan'],
        'nap_vao' => (float)$r['nap_vao'],
        'phi' => (float)$r['phi']
    ];
}

/* ============ TOP NTD ============ */
$topNTD = $pdo->query("SELECT n.id, n.ten_cong_ty,
    COUNT(bd.id) AS so_gd,
    IFNULL(SUM(bd.phi_dich_vu),0) AS doanh_thu
    FROM bao_dam_thanh_toan bd
    JOIN nha_tuyen_dung n ON n.id=bd.nha_tuyen_dung_id
    WHERE bd.trang_thai='da_giai_ngan'
    GROUP BY n.id ORDER BY doanh_thu DESC LIMIT 5")->fetchAll();

/* ============ TOP SV ============ */
$topSV = $pdo->query("SELECT id, ho_ten, ma_sinh_vien, diem_danh_gia, so_lan_danh_gia
    FROM sinh_vien WHERE so_lan_danh_gia > 0
    ORDER BY diem_danh_gia DESC LIMIT 5")->fetchAll();

/* ============ CẦN XỬ LÝ ============ */
$pendingVerify = 0;
$pendingComplaints = 0;
try { $pendingVerify = (int)$pdo->query("SELECT COUNT(*) FROM yeu_cau_xac_thuc WHERE trang_thai='cho_duyet'")->fetchColumn(); } catch (Exception $e) {}
try { $pendingComplaints = (int)$pdo->query("SELECT COUNT(*) FROM khieu_nai WHERE trang_thai IN ('cho_xu_ly','dang_xu_ly')")->fetchColumn(); } catch (Exception $e) {}

json_out([
    'success' => true,
    'overview' => [
        'total_sv' => $totalSV,
        'total_ntd' => $totalNTD,
        'total_jobs' => $totalJobs,
        'total_apps' => $totalApps,
        'pending_verify' => $pendingVerify,
        'pending_complaints' => $pendingComplaints,
    ],
    'match_rate' => ['matched'=>$matched, 'total'=>$totalValid, 'rate'=>$matchRate],
    'escrow' => [
        'cho_ky_quy' => (float)$escrowStats['cho_ky_quy'],
        'dang_giu' => (float)$escrowStats['dang_giu'],
        'da_giai_ngan' => (float)$escrowStats['da_giai_ngan'],
        'da_hoan' => (float)$escrowStats['da_hoan'],
    ],
    'revenue' => [
    'tong' => (float)$revenue['tong_phi'] + (float)$revenueSV['tong_phi_sv'],
    'tu_ntd' => (float)$revenue['tong_phi'],
    'tu_sv' => (float)$revenueSV['tong_phi_sv'],
    'so_gd_ntd' => (int)$revenue['so_gd'],
    'so_gd_sv' => (int)$revenueSV['so_gd'],
    ],
    'wallets' => [
        'ntd' => $walletNTD,
        'sv' => $walletSV,
        'tong' => $walletNTD + $walletSV,
    ],
    'chart' => $chart,
    'top_ntd' => $topNTD,
    'top_sv' => $topSV,
]);