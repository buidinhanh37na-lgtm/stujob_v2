<?php
require_once __DIR__ . '/_helpers-employer.php';
require_once __DIR__ . '/../../config/database.php';
$ntdId = require_employer();
$action = $_GET['action'] ?? 'summary';

if ($action === 'summary') {
    $from = $_GET['from'] ?? date('Y-m-01');
    $to = $_GET['to'] ?? date('Y-m-d');

    $q1 = $pdo->prepare("SELECT COUNT(*) AS so_gd, IFNULL(SUM(so_tien),0) AS tong,
                         IFNULL(SUM(phi_dich_vu),0) AS phi
                         FROM bao_dam_thanh_toan
                         WHERE nha_tuyen_dung_id=? AND trang_thai='da_giai_ngan'
                         AND DATE(ngay_giai_ngan) BETWEEN ? AND ?");
    $q1->execute([$ntdId, $from, $to]);
    $total = $q1->fetch();

    $q2 = $pdo->prepare("SELECT COUNT(*) AS so_gd, IFNULL(SUM(so_tien),0) AS tong
                         FROM bao_dam_thanh_toan
                         WHERE nha_tuyen_dung_id=? AND trang_thai IN ('da_nap','cho_nghiem_thu')");
    $q2->execute([$ntdId]);
    $escrowed = $q2->fetch();

    $q3 = $pdo->prepare("SELECT nv.ten_nhom, COUNT(bd.id) AS so_gd, IFNULL(SUM(bd.so_tien),0) AS tong
                         FROM bao_dam_thanh_toan bd
                         JOIN viec_lam v ON bd.viec_lam_id=v.id
                         LEFT JOIN nhom_viec nv ON v.nhom_viec_id=nv.id
                         WHERE bd.nha_tuyen_dung_id=? AND bd.trang_thai='da_giai_ngan'
                         AND DATE(bd.ngay_giai_ngan) BETWEEN ? AND ?
                         GROUP BY nv.id");
    $q3->execute([$ntdId, $from, $to]);
    $byCategory = $q3->fetchAll();

    $q4 = $pdo->prepare("SELECT bd.id, bd.so_tien, bd.phi_dich_vu, bd.trang_thai, bd.ma_giao_dich,
                         bd.created_at, bd.ngay_giai_ngan, v.tieu_de, sv.ho_ten, sv.ma_sinh_vien,
                         nv.ten_nhom
                         FROM bao_dam_thanh_toan bd
                         JOIN viec_lam v ON bd.viec_lam_id=v.id
                         JOIN sinh_vien sv ON bd.sinh_vien_id=sv.id
                         LEFT JOIN nhom_viec nv ON v.nhom_viec_id=nv.id
                         WHERE bd.nha_tuyen_dung_id=?
                         AND DATE(bd.created_at) BETWEEN ? AND ?
                         ORDER BY bd.created_at DESC");
    $q4->execute([$ntdId, $from, $to]);
    $details = $q4->fetchAll();

    json_out([
        'success'=>true,
        'tong'=>$total,
        'dang_giu'=>$escrowed,
        'theo_nhom'=>$byCategory,
        'chi_tiet'=>$details
    ]);
}

if ($action === 'export_csv') {
    $from = $_GET['from'] ?? date('Y-m-01');
    $to = $_GET['to'] ?? date('Y-m-d');

    $q = $pdo->prepare("SELECT bd.ma_giao_dich, v.tieu_de, sv.ho_ten, sv.ma_sinh_vien,
                        bd.so_tien, bd.phi_dich_vu, bd.trang_thai, bd.created_at, bd.ngay_giai_ngan
                        FROM bao_dam_thanh_toan bd
                        JOIN viec_lam v ON bd.viec_lam_id=v.id
                        JOIN sinh_vien sv ON bd.sinh_vien_id=sv.id
                        WHERE bd.nha_tuyen_dung_id=?
                        AND DATE(bd.created_at) BETWEEN ? AND ?
                        ORDER BY bd.created_at DESC");
    $q->execute([$ntdId, $from, $to]);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="bao-cao-chi-phi-'.date('Ymd-His').'.csv"');
    $out = fopen('php://output', 'w');
    fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
    fputcsv($out, ['STT','Mã GD','Công việc','SV','MSSV','Thù lao','Phí DV','Tổng','Trạng thái','Ngày tạo','Ngày giải ngân']);
    $i = 1;
    foreach ($q->fetchAll() as $r) {
        $total = (float)$r['so_tien'] + (float)$r['phi_dich_vu'];
        fputcsv($out, [
            $i++, $r['ma_giao_dich'], $r['tieu_de'], $r['ho_ten'], $r['ma_sinh_vien'],
            number_format($r['so_tien'], 0, '.', '.'),
            number_format($r['phi_dich_vu'], 0, '.', '.'),
            number_format($total, 0, '.', '.'),
            $r['trang_thai'], $r['created_at'], $r['ngay_giai_ngan'] ?? ''
        ]);
    }
    fclose($out);
    exit;
}