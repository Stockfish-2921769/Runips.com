#!/usr/bin/env bash
set -euo pipefail

database_container=${RUNIPS_DATABASE_CONTAINER:-supabase-db}
community_user_id=${1:-}
community_role=${2:-owner}

if [[ ! "${community_user_id}" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$ ]]; then
  printf 'usage: %s <confirmed-auth-user-uuid> [owner|moderator]\n' "$0" >&2
  exit 2
fi

if [[ "${community_role}" != "owner" && "${community_role}" != "moderator" ]]; then
  printf 'role must be owner or moderator\n' >&2
  exit 2
fi

docker exec -i "${database_container}" psql \
  -v ON_ERROR_STOP=1 \
  -v community_user_id="${community_user_id}" \
  -v community_role="${community_role}" \
  -U postgres \
  -d postgres <<'SQL'
select exists (
  select 1
  from auth.users
  where id = :'community_user_id'::uuid
) as community_user_exists \gset

\if :community_user_exists
insert into public.community_moderators (user_id, role)
values (:'community_user_id'::uuid, :'community_role')
on conflict (user_id) do update set role = excluded.role;
\else
\echo 'No auth.users row matches the supplied UUID.'
\quit 1
\endif
SQL

printf 'Community role %s granted to confirmed account %s\n' \
  "${community_role}" "${community_user_id}"
