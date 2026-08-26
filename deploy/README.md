# RunIPS self-hosted deployment

The Singapore deployment keeps all mutable state on `/mnt/datadisk0`:

- frontend releases: `/mnt/datadisk0/runips/frontend/releases`
- active frontend symlink: `/mnt/datadisk0/runips/frontend/current`
- Supabase/PostgreSQL stack: `/mnt/datadisk0/runips/backend/supabase-repo/docker`
- PostgreSQL data: the official stack's `volumes/db/data`
- database backups: `/mnt/datadisk0/runips/backups/postgres`
- server-only service secrets: `/mnt/datadisk0/runips/secrets`

The backend is pinned to the official Supabase self-hosted release recorded in
`backend/supabase-repo/.git`. `docker-compose.runips.yml` binds the API gateway
and database pooler to loopback; Nginx exposes only `/auth/v1` and `/rest/v1`.

Inspect or start the backend from its Docker directory:

```bash
cd /mnt/datadisk0/runips/backend/supabase-repo/docker
docker compose -f docker-compose.yml -f docker-compose.runips.yml ps
docker compose -f docker-compose.yml -f docker-compose.runips.yml up -d
```

The current application and frontend are release directories selected through
atomic `current` symlinks. Roll back by repointing the relevant symlink to a
known-good release and reloading Nginx; do not delete the newer release until
the rollback has been verified.

Apply application migrations from the application release root:

```bash
deploy/scripts/apply-migrations.sh
```

Create a manual database backup:

```bash
deploy/scripts/backup-postgres.sh
```

## Community moderation bootstrap

Community moderation is deny-by-default. After the Community migration has
been applied, an operator must confirm which signed-in account they control and
grant that exact account a role. Never select the newest anonymous account by
guesswork.

Inspect authentication accounts from the server console, confirm the UUID with
the intended operator, then grant access:

```bash
docker exec supabase-db psql -X -U postgres -d postgres \
  -c "select id, email, is_anonymous, last_sign_in_at from auth.users order by last_sign_in_at desc;"

deploy/scripts/grant-community-moderator.sh CONFIRMED_USER_UUID owner
```

The role opens `/community/moderation/` and enables topic and reply moderation.
Deleting that RunIPS account also removes its Community role.

Restore into an empty database with `pg_restore --clean --if-exists`. Never
commit the backend `.env`; it contains the PostgreSQL password and signing keys.

TLS is terminated by Nginx and renewed by the system Certbot timer. The current
temporary public hosts use `sslip.io`; when the permanent domain is pointed at
the server, update the Nginx hostnames and public frontend environment values,
then rebuild the static export.

`nginx/runips-log-format.conf` defines a privacy-minimised access format that
omits query strings and referrers. Install it in `/etc/nginx/conf.d/` alongside
the site configuration. Install `logrotate/runips` in `/etc/logrotate.d/` to
enforce the documented 14-day application-log retention period.

The `runips-citations` systemd service and timer refresh maintainable numeric
citation counts from OpenAlex each day. The frontend labels that source and
links each professor to a live Google Scholar query for current cross-checking;
Google Scholar does not offer supported bulk access for a direct scheduled
feed.

## Travel Guide flight search

The static frontend posts route and date fields to the same-origin endpoint
`/api/travel/v1/search`. Nginx proxies that exact path to the loopback-only
Node service at `127.0.0.1:18010`. The service validates the request, queries
the SerpApi Google Flights API, groups returned itineraries by ordered transfer
airport pattern, and returns only normalised fields required by the interface.

The SerpApi key must never enter a frontend build or the repository. Store it in
`/mnt/datadisk0/runips/secrets/travel-api.env`, owned by `fred` with mode `600`:

```text
SERPAPI_API_KEY=replace-with-the-server-secret
TRAVEL_API_PORT=18010
TRAVEL_CACHE_TTL_MS=600000
TRAVEL_UPSTREAM_TIMEOUT_MS=45000
TRAVEL_ALLOWED_DESTINATIONS=FUK,KKJ
TRAVEL_PROVIDER_NO_CACHE=false
TRAVEL_UPSTREAM_LIMIT_PER_HOUR=8
TRAVEL_UPSTREAM_DAILY_LIMIT=40
```

Install `systemd/runips-travel-api.service` in `/etc/systemd/system/`, then
enable and start `runips-travel-api.service`. The default ten-minute cache is
in memory only. Search bodies and provider credentials are not logged. The
public Nginx access format records the path but not request bodies or query
strings.

Useful checks:

```bash
systemctl status runips-travel-api.service
curl --fail http://127.0.0.1:18010/health
journalctl -u runips-travel-api.service --since today
```

The free SerpApi allowance is limited. The service therefore applies a
per-connection upstream limit and a shared rolling daily ceiling. Identical
queries can be served from the local cache; SerpApi's own one-hour cache remains
enabled unless `TRAVEL_PROVIDER_NO_CACHE=true` is explicitly chosen.
