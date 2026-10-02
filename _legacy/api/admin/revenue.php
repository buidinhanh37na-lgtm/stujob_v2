<?php
require_once __DIR__ . '/_helpers-admin.php';
require_admin();

$action = $_GET['action'] ?? 'summary';
$from = $_GET['from'] ?? date('Y-m-01');
$to = $_GET['to'] ?? date('Y-m-d');

/* ============================================================
   TỔNG HỢP DOANH THU
   ============================================================ */
if ($action === 'summary') {

    /* 1. Tổng doanh thu */
    $q1 = $pdo->prepare("SELECT IFNULL(SUM(phi_dich_vu),0) AS tong
                         FROM bao_dam_thanh_toan
                         WHERE trang_thai='da_giai_ngan'
                         AND DATE(ngay_giai_ngan) BETWEEN ? AND ?");
    $q1->execute([$from, $to]);
    $feeNTD = (float)$q1->fetchColumn();

    $q2 = $pdo->prepare("SELECT IFNULL(SUM(phi_san),0) AS tong
                         FROM giao_dich
                         WHERE loai='thu_nhap' AND phi_san > 0
                         AND DATE(created_at) BETWEEN ? AND ?");
    $q2->execute([$from, $to]);
    $feeSV = (float)$q2->fetchColumn();

    $totalRevenue = $feeNTD + $feeSV;

    /* 2. Tổng giao dịch */
    $q3 = $pdo->prepare("SELECT COUNT(*) FROM bao_dam_thanh_toan
                         WHERE trang_thai='da_giai_ngan'
                         AND DATE(ngay_giai_ngan) BETWEEN ? AND ?");
    $q3->execute([$from, $to]);
    $countNTD = (int)$q3->fetchColumn();

    $q4 = $pdo->prepare("SELECT COUNT(*) FROM giao_dich
                         WHERE loai='thu_nhap' AND phi_san > 0
                         AND DATE(created_at) BETWEEN ? AND ?");
    $q4->execute([$from, $to]);
    $countSV = (int)$q4->fetchColumn();

    /* 3. Doanh thu theo ngày (cho biểu đồ) */
    $chart = [];
    $days = (strtotime($to) - strtotime($from)) / 86400;
    $days = min($days, 90); // Giới hạn 90 ngày

    for ($i = $days; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("$to -$i days"));

        $q5 = $pdo->prepare("SELECT IFNULL(SUM(phi_dich_vu),0) FROM bao_dam_thanh_toan
                             WHERE trang_thai='da_giai_ngan' AND DATE(ngay_giai_ngan)=?");
        $q5->execute([$date]);
        $feeNTD_day = (float)$q5->fetchColumn();

        $q6 = $pdo->prepare("SELECT IFNULL(SUM(phi_san),0) FROM giao_dich
                             WHERE loai='thu_nhap' AND phi_san > 0 AND DATE(created_at)=?");
        $q6->execute([$date]);
        $feeSV_day = (float)$q6->fetchColumn();

        $chart[] = [
            'date' => date('d/m', strtotime($date)),
            'full_date' => $date,
            'ntd' => $feeNTD_day,
            'sv' => $feeSV_day,
            'tong' => $feeNTD_day + $feeSV_day
        ];
    }

    /* 4. Top NTD đóng phí nhiều nhất */
    $q7 = $pdo->prepare("SELECT n.ten_cong_ty, COUNT(bd.id) AS so_gd,
                         IFNULL(SUM(bd.phi_dich_vu),0) AS doanh_thu
                         FROM bao_dam_thanh_toan bd
                         JOIN nha_tuyen_dung n ON n.id=bd.nha_tuyen_dung_id
                         WHERE bd.trang_thai='da_giai_ngan'
                         AND DATE(bd.ngay_giai_ngan) BETWEEN ? AND ?
                         GROUP BY n.id ORDER BY doanh_thu DESC LIMIT 5");
    $q7->execute([$from, $to]);
    $topNTD = $q7->fetchAll();

    /* 5. Top SV đóng phí nhiều nhất */
    $q8 = $pdo->prepare("SELECT sv.ho_ten, sv.ma_sinh_vien,
                         COUNT(gd.id) AS so_gd,
                         IFNULL(SUM(gd.phi_san),0) AS doanh_thu
                         FROM giao_dich gd
                         JOIN sinh_vien sv ON sv.id=gd.sinh_vien_id
                         WHERE gd.loai='thu_nhap' AND gd.phi_san > 0
                         AND DATE(gd.created_at) BETWEEN ? AND ?
                         GROUP BY sv.id ORDER BY doanh_thu DESC LIMIT 5");
    $q8->execute([$from, $to]);
    $topSV = $q8->fetchAll();

    /* 6. Doanh thu theo tháng (6 tháng gần nhất) */
    $monthly = [];
    for ($i = 5; $i >= 0; $i--) {
        $m = date('Y-m', strtotime("-$i months"));
        $start = $m . '-01';
        $end = date('Y-m-t', strtotime($m . '-01'));

        $q9 = $pdo->prepare("SELECT IFNULL(SUM(phi_dich_vu),0) FROM bao_dam_thanh_toan
                             WHERE trang_thai='da_giai_ngan' AND DATE(ngay_giai_ngan) BETWEEN ? AND ?");
        $q9->execute([$start, $end]);
        $ntd_month = (float)$q9->fetchColumn();

        $q10 = $pdo->prepare("SELECT IFNULL(SUM(phi_san),0) FROM giao_dich
                              WHERE loai='thu_nhap' AND phi_san > 0
                              AND DATE(created_at) BETWEEN ? AND ?");
        $q10->execute([$start, $end]);
        $sv_month = (float)$q10->fetchColumn();

        $monthly[] = [
            'month' => date('m/Y', strtotime($m . '-01')),
            'ntd' => $ntd_month,
            'sv' => $sv_month,
            'tong' => $ntd_month + $sv_month
        ];
    }

    json_out([
        'success' => true,
        'period' => ['from' => $from, 'to' => $to],
        'total' => [
            'revenue' => $totalRevenue,
            'from_ntd' => $feeNTD,
            'from_sv' => $feeSV,
            'count_ntd' => $countNTD,
            'count_sv' => $countSV,
            'count_total' => $countNTD + $countSV
        ],
        'chart' => $chart,
        'monthly' => $monthly,
        'top_ntd' => $topNTD,
        'top_sv' => $topSV
    ]);
}

/* ============================================================
   XUẤT CSV
   ============================================================ */
if ($action === 'export') {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="doanh-thu-'.date('Ymd-His').'.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));

    // Sheet 1: Doanh thu theo ngày
    fputcsv($out, ['BÁO CÁO DOANH THU']);
    fputcsv($out, ['Từ ngày:', $from, 'Đến ngày:', $to]);
    fputcsv($out, []);
    fputcsv($out, ['NGÀY', 'TỪ NTD (đ)', 'TỪ SV (đ)', 'TỔNG (đ)']);

    $q = $pdo->prepare("SELECT DATE(ngay_giai_ngan) AS date, IFNULL(SUM(phi_dich_vu),0) AS ntd
                        FROM bao_dam_thanh_toan
                        WHERE trang_thai='da_giai_ngan'
                        AND DATE(ngay_giai_ngan) BETWEEN ? AND ?
                        GROUP BY DATE(ngay_giai_ngan)
                        ORDER BY date");
    $q->execute([$from, $to]);
    $ntdByDay = [];
    foreach ($q->fetchAll() as $row) {
        $ntdByDay[$row['date']] = (float)$row['ntd'];
    }

    $q = $pdo->prepare("SELECT DATE(created_at) AS date, IFNULL(SUM(phi_san),0) AS sv
                        FROM giao_dich
                        WHERE loai='thu_nhap' AND phi_san > 0
                        AND DATE(created_at) BETWEEN ? AND ?
                        GROUP BY DATE(created_at)
                        ORDER BY date");
    $q->execute([$from, $to]);
    $svByDay = [];
    foreach ($q->fetchAll() as $row) {
        $svByDay[$row['date']] = (float)$row['sv'];
    }

    $allDates = array_unique(array_merge(array_keys($ntdByDay), array_keys($svByDay)));
    sort($allDates);
    $totalNTD = 0; $totalSV = 0;
    foreach ($allDates as $d) {
        $ntd = $ntdByDay[$d] ?? 0;
        $sv = $svByDay[$d] ?? 0;
        $totalNTD += $ntd;
        $totalSV += $sv;
        fputcsv($out, [date('d/m/Y', strtotime($d)), number_format($ntd), number_format($sv), number_format($ntd + $sv)]);
    }
    fputcsv($out, ['TỔNG', number_format($totalNTD), number_format($sv ?? 0) . '', number_format($totalNTD + $totalSV)]);

    fclose($out);
    exit;
}

json_out(['success' => false, 'message' => 'Action không hợp lệ']);