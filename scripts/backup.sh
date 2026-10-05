#!/bin/bash
set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sinhvien_webapp"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-password}"
DB_HOST="${DB_HOST:-localhost}"

mkdir -p "$BACKUP_DIR"

echo "🔄 Đang backup database..."

if docker ps --format '{{.Names}}' | grep -q "mysql"; then
  docker exec stujob-mysql mysqldump -u"$DB_USER" -p"$DB_PASS" "$DB_NAME" \
    > "$BACKUP_DIR/db_${DATE}.sql" 2>/dev/null
else
  mysqldump -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" "$DB_NAME" \
    > "$BACKUP_DIR/db_${DATE}.sql"
fi

echo "🔄 Đang backup uploads..."
tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" ./uploads 2>/dev/null || true

echo "🧹 Xóa backup cũ (>7 ngày)..."
find "$BACKUP_DIR" -name "db_*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -mtime +7 -delete

echo "✅ Backup xong:"
ls -lh "$BACKUP_DIR" | tail -n 5