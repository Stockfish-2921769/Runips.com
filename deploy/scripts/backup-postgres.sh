#!/usr/bin/env bash
set -euo pipefail

database_container=${RUNIPS_DATABASE_CONTAINER:-supabase-db}
backup_root=${RUNIPS_BACKUP_ROOT:-/mnt/datadisk0/runips/backups/postgres}
retention_days=${RUNIPS_BACKUP_RETENTION_DAYS:-14}
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_file="${backup_root}/runips-${timestamp}.dump"

umask 077
mkdir -p "${backup_root}"

docker exec "${database_container}" pg_dump \
  --username postgres \
  --dbname postgres \
  --format custom \
  --no-owner \
  --no-privileges > "${backup_file}.partial"

mv "${backup_file}.partial" "${backup_file}"
find "${backup_root}" -type f -name 'runips-*.dump' -mtime "+${retention_days}" -delete

printf '%s\n' "${backup_file}"
