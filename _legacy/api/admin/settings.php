<?php
require_once __DIR__ . '/_helpers-admin.php';
$admin = require_admin();
$m = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

/* ============ LẤY TẤT CẢ CẤU HÌNH ============ */
if ($m === 'GET' && $action === 'list') {
    json_out(['success'=>true, 'items'=>get_all_config($pdo)]);
}

/* ============ LƯU CẤU HÌNH ============ */
if ($m === 'POST' && $action === 'update') {
    $admin = require_role($pdo, ['super_admin','admin']);
    $d = body();
    $items = $d['items'] ?? [];
    if (empty($items)) json_out(['success'=>false,'message'=>'Không có dữ liệu']);

    $pdo->beginTransaction();
    try {
        foreach ($items as $k => $v) set_config($pdo, $k, $v);
        log_admin($pdo, $admin['id'], 'update_settings', null, null,
            'Cập nhật ' . count($items) . ' cấu hình');
        $pdo->commit();
        json_out(['success'=>true,'message'=>'Đã lưu cấu hình']);
    } catch (Exception $e) {
        $pdo->rollBack();
        json_out(['success'=>false,'message'=>'Lỗi: ' . $e->getMessage()]);
    }
}

/* ============ LẤY 1 CẤU HÌNH ============ */
if ($m === 'GET' && $action === 'get') {
    $key = $_GET['key'] ?? '';
    if (!$key) json_out(['success'=>false,'message'=>'Thiếu key']);
    json_out(['success'=>true, 'key'=>$key, 'value'=>get_config($pdo, $key)]);
}

/* ============ SYSTEM INFO ============ */
if ($m === 'GET' && $action === 'system-info') {
    $dbSize = (float)$pdo->query("SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2)
        FROM information_schema.TABLES WHERE table_schema = DATABASE()")->fetchColumn();

    $tables = (int)$pdo->query("SELECT COUNT(*) FROM information_schema.TABLES
        WHERE table_schema = DATABASE()")->fetchColumn();

    $uploadsSize = 0;
    $uploadDir = __DIR__ . '/../../uploads/';
    if (is_dir($uploadDir)) {
        try {
            $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($uploadDir));
            foreach ($it as $f) {
                if ($f->isFile()) $uploadsSize += $f->getSize();
            }
        } catch (Exception $e) {}
    }

    json_out([
        'success'=>true,
        'php_version'=>PHP_VERSION,
        'mysql_version'=>$pdo->query("SELECT VERSION()")->fetchColumn(),
        'db_size_mb'=>$dbSize,
        'tables'=>$tables,
        'uploads_size_mb'=>round($uploadsSize / 1024 / 1024, 2),
        'server_time'=>date('d/m/Y H:i:s')
    ]);
}