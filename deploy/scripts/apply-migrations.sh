#!/usr/bin/env bash
set -euo pipefail

repository_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
migrations_dir="${repository_root}/supabase/migrations"
database_container=${RUNIPS_DATABASE_CONTAINER:-supabase-db}

docker exec -i "${database_container}" psql -v ON_ERROR_STOP=1 -U postgres -d postgres <<'SQL'
create schema if not exists runips_internal;
revoke all on schema runips_internal from public, anon, authenticated;
create table if not exists runips_internal.schema_migrations (
  version text primary key,
  applied_at timestamptz not null default now()
);
SQL

for migration_file in "${migrations_dir}"/*.sql; do
  migration_name=$(basename "${migration_file}")
  already_applied=$(
    docker exec "${database_container}" psql -Atq -U postgres -d postgres \
      -c "select 1 from runips_internal.schema_migrations where version = '${migration_name}'"
  )

  if [[ "${already_applied}" == "1" ]]; then
    printf 'already applied: %s\n' "${migration_name}"
    continue
  fi

  {
    printf 'begin;\n'
    cat "${migration_file}"
    printf "\ninsert into runips_internal.schema_migrations (version) values ('%s');\n" "${migration_name}"
    printf 'commit;\n'
  } | docker exec -i "${database_container}" psql -v ON_ERROR_STOP=1 -U postgres -d postgres

  printf 'applied: %s\n' "${migration_name}"
done

docker exec "${database_container}" psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -c "notify pgrst, 'reload schema';" >/dev/null
