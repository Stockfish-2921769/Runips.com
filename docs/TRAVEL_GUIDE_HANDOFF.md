# Travel Guide: implementation and production handoff

Last updated: 26 August 2026

## Production outcome

The first live airline-focused Travel Guide is deployed:

- page: <https://runips.43.159.51.15.sslip.io/travel/>
- same-origin search API: <https://runips.43.159.51.15.sslip.io/api/travel/v1/search>
- health check: <https://runips.43.159.51.15.sslip.io/api/travel/v1/health>

The user supplies a home airport, chooses `FUK` or `KKJ`, and selects a date.
RunIPS obtains indexed same-day itineraries from the SerpApi Google Flights
API, groups them by direct or ordered transfer-airport pattern, and shows the
lowest-priced real itinerary returned for each pattern. Selecting a pattern
updates the route view, local times, flight numbers, airlines, aircraft,
connections, price, Google Flights link, ITA Matrix routing code, and transfer
document screen.

This release deliberately ends at `FUK` or `KKJ`. Airport-to-campus and nearby
transport are labelled as a later stage and are not silently approximated.

No sample timetable or fabricated flight is shown. Until a search succeeds,
the result area remains empty.

## Product scope and decisions

- The module is named **Travel Guide** / **旅行指南**.
- Current destinations are exactly Fukuoka (`FUK`) and Kitakyushu (`KKJ`).
- Searches are one-way, economy, one exact date, and priced in JPY.
- The traveller is assumed to hold the Japanese student residence status
  needed for the final destination.
- The current document module therefore screens risks at transfer points. It
  does not decide whether the user may enter Japan.
- Passport country, protected/separate ticket, and baggage handling affect the
  transfer screen but not the flight-provider query.
- English is the default language, Chinese is available, and English product
  copy uses British spelling.
- The visualisation is intentionally dependency-free and light enough for the
  existing server: SVG route view, CSS, and React only.
- Flight prices and availability are indexed search results, not a quote or a
  reservation. The page says this before presenting external booking tools.

## End-to-end user flow

1. Open `/travel/`.
2. Enter a three-letter home-airport IATA code.
3. Choose `FUK` or `KKJ` and a departure date within the next 365 days.
4. Optionally enter the passport-issuing country and select the ticket and
   baggage arrangement. These three answers remain in the browser.
5. Select **Search flights**.
6. Compare cards representing direct travel or a particular ordered transfer
   pattern. A card contains the cheapest returned itinerary in that pattern
   and the number of alternatives found.
7. Select a card to inspect the real segments, local departure/arrival times,
   airline, aircraft, duration, layover, and returned price.
8. Use **Open in Google Flights** to refresh price and continue towards a
   booking channel.
9. For advanced fare construction, copy the exact ITA routing code and open a
   prefilled ITA Matrix one-way search.
10. Review the transfer screen before payment, especially for separate tickets
    or baggage that must be collected during transit.

Changing passport, ticket, or baggage answers updates the transfer screen
without causing another provider request. Changing route/date inputs does not
replace displayed results until a new search succeeds.

## Architecture and data boundary

```text
Browser: /travel/
  ├─ route + date ──POST──> /api/travel/v1/search
  │                            │
  │                         Nginx exact location
  │                            │
  │                         127.0.0.1:18010
  │                            │
  │                         Node travel-api
  │                            │
  │                         SerpApi Google Flights API
  │
  └─ passport + ticket + baggage ──> browser-only transfer screen
```

The Next.js application remains a static export. The only new runtime is a
small native Node service with no third-party npm dependencies. It listens on
loopback and is exposed only through the two exact Nginx locations.

The travel service has no database connection. Its ten-minute result cache,
rate-limit counters, in-flight request coalescing, and daily allowance counter
exist only in process memory and disappear on restart.

The browser sends only:

```json
{
  "origin": "PEK",
  "destination": "FUK",
  "departureDate": "2026-09-20"
}
```

The browser does **not** send an account ID, passport country, ticket answer,
or baggage answer. Nginx supplies the client address to the local service only
for per-connection limits; the service does not forward that address to
SerpApi.

## Flight provider request

`services/travel-api/serpapi.mjs` makes a server-side request to
`https://serpapi.com/search.json` with these fixed choices:

| Parameter | Value |
| --- | --- |
| `engine` | `google_flights` |
| `departure_id` | validated origin |
| `arrival_id` | validated `FUK` or `KKJ` |
| `outbound_date` | validated date |
| `type` | `2` (one-way) |
| `travel_class` | `1` (economy) |
| `currency` | `JPY` |
| `gl` | `jp` |
| `hl` | `en` |
| `deep_search` | `true` |
| `show_hidden` | `true` |

SerpApi's provider-side cache remains enabled. Setting
`TRAVEL_PROVIDER_NO_CACHE=true` adds `no_cache=true`, consumes more provider
searches, and should only be used deliberately.

The API key exists only in the server environment file. It is never returned
by the service, sent to the browser, written into the static export, or
committed to the repository.

## Public API contract

### `POST /api/travel/v1/search`

Request requirements:

- JSON object only;
- `origin`: exactly three ASCII letters after normalisation;
- `destination`: `FUK` or `KKJ` only;
- origin and destination must differ;
- `departureDate`: real `YYYY-MM-DD` date, from the current Tokyo date through
  365 days ahead;
- Nginx accepts at most 8 KiB and the service reads at most 4 KiB.

A successful response is shaped as follows:

```json
{
  "query": {
    "origin": "PEK",
    "destination": "FUK",
    "departureDate": "2026-09-20",
    "currency": "JPY",
    "travelClass": "Economy"
  },
  "checkedAt": "ISO-8601 timestamp",
  "providerFetchedAt": "ISO-8601 timestamp",
  "googleFlightsUrl": "https://www.google.com/...",
  "routeGroups": [
    {
      "id": "hkg",
      "kind": "connection",
      "connectionCodes": ["HKG"],
      "cheapestOffer": {
        "id": "opaque safe identifier",
        "price": { "amount": 34803, "currency": "JPY" },
        "totalDurationMinutes": 675,
        "segments": [],
        "layovers": [],
        "extensions": []
      },
      "alternativeCount": 8
    }
  ],
  "offerCount": 57,
  "priceInsights": null,
  "source": "SerpApi Google Flights API",
  "cache": { "hit": true, "ageSeconds": 345, "ttlSeconds": 600 }
}
```

Each segment contains only the normalised fields required by the UI: endpoint
airport code/name/local time, duration, airline, flight number, aircraft,
travel class, overnight/delay flags, and any separately supplied operating
carrier. Provider tokens, raw payloads, API credentials, and booking secrets
are discarded.

Errors use this stable envelope:

```json
{
  "error": {
    "code": "INVALID_DATE",
    "message": "Departure date must use YYYY-MM-DD."
  }
}
```

Expected classes are validation `400`, oversized request `413`, local limit
`429`, provider/daily allowance `503`, provider timeout `504`, and unexpected
server error `500`. Limited responses include `Retry-After` where known.

### `GET /api/travel/v1/health`

Returns service state and whether a provider credential is configured. It does
not reveal the credential or call the provider.

## Normalisation and route grouping

The service combines `best_flights` and `other_flights`, then applies this
pipeline:

1. Drop malformed offers and offers whose first/last airports do not match the
   validated query.
2. Normalise strings, numeric fields, booleans, local times, segments, and
   layovers into the public contract.
3. Fingerprint each segment sequence and deduplicate identical returned
   itineraries, retaining the cheaper duplicate.
4. Build the group signature from ordered layover codes: `DIRECT`, `ICN`,
   `HKG`, or a multi-stop value such as `ICN>HND`.
5. Retain the lowest price in each group; break equal-price ties by total
   duration.
6. Sort direct first, then connections by price and duration.
7. Return at most eight route-pattern cards while preserving the count of
   alternatives within each returned pattern.

The cards compare route patterns; they do not claim that the cheapest pattern
is operationally best. The document screen and segment timeline expose
trade-offs after selection.

## Google Flights and ITA Matrix hand-off

The Google Flights button prefers the URL returned in SerpApi metadata. The
backend accepts it only when it is HTTPS and the hostname is `google.com` or a
subdomain. If none is supplied, the frontend builds a generic Google Flights
query from origin, destination, and date.

The ITA Matrix integration derives a compact sequence from the selected real
segments, for example:

```text
CX395 CX588
```

It embeds that sequence into a one-way coach Matrix search payload and also
offers a copy button because Matrix's encoded URL is an external integration
detail. The user can continue editing routing and extension codes inside
Matrix.

SerpApi's Google Flights response does not guarantee a fare basis/fare code.
This release therefore supplies an exact **flight routing code**, not a
guaranteed fare basis. Matrix may return different availability or fail to
retain the prefill if its undocumented URL format changes.

## Transfer document screen

The current screen is a conservative prompt, not a visa-decision engine:

| Condition | UI state | Meaning |
| --- | --- | --- |
| Transfer airport is in Japan | `japan-entry` | Immigration/customs may occur before a domestic sector. |
| Separate tickets or baggage collection outside Japan | `landside` | Entry or transit authorisation may be needed; check official passport-specific rules. |
| Passport missing, ticket unknown, or baggage unknown | `verify` | Confirm boarding-pass and baggage handling with the operating airlines. |
| Protected ticket with known non-collection baggage plan | `low` | Lower operational friction, but official passport-specific rules still require confirmation. |

Connection-time warnings are UI heuristics only:

- below 180 minutes for landside or Japanese-entry transfers;
- below 120 minutes when the arrangement is unknown;
- below 75 minutes for the lower-friction state.

Overnight connections are called out separately. No nationality-to-visa table
has been invented. Adding definitive document requirements requires an
authoritative, dated rules source, auditable country/airport logic, and legal
review.

## Privacy, legal, and retention behaviour

`src/content/legal.ts` now explains the Travel Guide in both the Privacy Notice
and Terms and Conditions:

- route, date, fixed cabin, and query time are processed for the requested
  live search;
- passport, ticket, and baggage answers remain in React state in the current
  browser and are not attached to an account;
- RunIPS does not store searches in PostgreSQL;
- the local result cache lasts no more than ten minutes in memory;
- application access logs omit query strings and bodies and are covered by the
  documented 14-day maximum;
- SerpApi, LLC is identified as the US flight-search recipient;
- SerpApi's Search Archive retention of up to 31 days is disclosed;
- the notice does not make an unsupported claim that SerpApi supplies a DPA or
  SCC mechanism;
- Chapter V data-minimisation and stop-transfer wording is explicit;
- opening Google Flights or ITA Matrix contacts those third parties directly;
- prices, timetables, availability, and document prompts are disclaimed
  accurately.

The existing self-service **Account and data** erasure flow is unaffected.
There is normally no account-linked Travel Guide query to erase because the
travel service does not receive an account ID or write a search record.

## Runtime controls

Default limits are intentionally conservative for the current SerpApi plan:

| Control | Default | Scope |
| --- | ---: | --- |
| browser/service request limit | 60 per 10 minutes | per forwarded client address |
| uncached provider limit | 8 per hour | per forwarded client address |
| shared uncached provider limit | 40 per rolling 24-hour window | whole process |
| RunIPS result cache | 10 minutes | identical route/date/cabin key |
| upstream timeout | 45 seconds | each provider request |
| upstream response limit | 8 MiB | each provider response |

Concurrent identical cache misses are coalesced into one upstream request.
These counters are in memory, so restarting the service resets them. This is a
cost-safety mechanism, not billing-grade metering. Monitor the SerpApi account
separately before increasing any limit.

All API responses use `Cache-Control: no-store`. The Nginx privacy access-log
format records the path but neither a request body nor a query string.

## File map

### Runtime service

- `services/travel-api/package.json` — Node >=22 scripts; no dependencies.
- `services/travel-api/server.mjs` — HTTP server, validation orchestration,
  memory cache, request coalescing, CORS, limits, and health check.
- `services/travel-api/serpapi.mjs` — provider request, safe normalisation,
  deduplication, grouping, and public response creation.
- `services/travel-api/serpapi.test.mjs` — validation, provider URL,
  normalisation, filtering, and grouping tests.

### Frontend

- `src/app/travel/page.tsx` — static `/travel` page and metadata.
- `src/features/travel-guide/TravelGuide.tsx` — form, validation, live request,
  state, errors, and composition.
- `src/features/travel-guide/FlightRouteExplorer.tsx` — route-pattern cards,
  selected offer, provider notice, Google Flights, and ITA Matrix actions.
- `src/features/travel-guide/FlightTimeline.tsx` — real segment timeline.
- `src/features/travel-guide/RouteMap.tsx` — lightweight SVG route view with a
  schematic fallback for unknown airport coordinates.
- `src/features/travel-guide/TransitDocumentChecker.tsx` — connection-level
  screening prompts.
- `src/features/travel-guide/airports.ts` — known airport coordinates and safe
  fallback resolution; it no longer manufactures sample itineraries.
- `src/features/travel-guide/itaMatrix.ts` — routing-code extraction and
  external URL builders.
- `src/features/travel-guide/model.ts` — request/result domain types and
  formatting helpers.
- `src/features/travel-guide/copy.ts` — feature-local English/Chinese copy.
- `src/components/Header.tsx` — desktop and mobile Travel Guide navigation.
- `src/content/legal.ts` — flight-provider privacy and terms disclosures.

### Deployment

- `deploy/systemd/runips-travel-api.service` — loopback service and systemd
  hardening.
- `deploy/nginx/runips.conf` — reference Nginx locations for a fresh install.
- `deploy/scripts/add-travel-nginx-location.mjs` — idempotently merges the two
  exact locations into the active Certbot-managed site.
- `deploy/README.md` — shared self-hosted operations notes.
- `docs/TRAVEL_GUIDE_HANDOFF.md` — this handoff.

The application and frontend paths are new/untracked in the current dirty
worktree; `Header.tsx` and `legal.ts` also contain main-thread work. Stage
specific paths after reviewing the combined diff. Do not stage the entire
repository blindly.

## Production deployment snapshot

Verified on 26 August 2026:

- SSH alias: `sg-vps`
- public host: `runips.43.159.51.15.sslip.io`
- current application release:
  `/mnt/datadisk0/runips/application/releases/20260826T110815Z`
- current frontend release:
  `/mnt/datadisk0/runips/frontend/releases/20260826T110815Z`
- known earlier rollback candidate for both:
  `/mnt/datadisk0/runips/{application,frontend}/releases/20260826T105020Z`
- service unit: `/etc/systemd/system/runips-travel-api.service`
- service state: enabled and active
- Nginx state: active
- service listener: `127.0.0.1:18010` only
- server Node: `v22.22.0`
- server secret file:
  `/mnt/datadisk0/runips/secrets/travel-api.env`, mode `600`, owner `fred:fred`
- pre-Travel Nginx backup:
  `/etc/nginx/sites-available/runips.before-travel-20260826T105020Z`

The credential value and the server administrator password are intentionally
absent from this document, source control, command history examples, and build
artefacts.

The first service-unit attempt used `MemoryDenyWriteExecute=true`, which is
incompatible with V8 JIT memory on this host and caused an immediate fatal
startup. The final unit deliberately omits that directive while retaining the
other systemd restrictions. Do not reintroduce it without launching Node in a
tested non-JIT mode.

## Server configuration

The secret environment file supports:

```text
SERPAPI_API_KEY=<server-only value>
TRAVEL_API_HOST=127.0.0.1
TRAVEL_API_PORT=18010
TRAVEL_CACHE_TTL_MS=600000
TRAVEL_UPSTREAM_TIMEOUT_MS=45000
TRAVEL_ALLOWED_DESTINATIONS=FUK,KKJ
TRAVEL_PROVIDER_NO_CACHE=false
TRAVEL_REQUEST_LIMIT_PER_10_MIN=60
TRAVEL_UPSTREAM_LIMIT_PER_HOUR=8
TRAVEL_UPSTREAM_DAILY_LIMIT=40
```

Do not print or copy the value of `SERPAPI_API_KEY` into support logs. Inspect
only ownership/mode when checking secret hygiene.

Useful non-secret operational checks:

```bash
ssh sg-vps 'systemctl is-active runips-travel-api.service'
ssh sg-vps 'systemctl is-enabled runips-travel-api.service'
ssh sg-vps 'systemctl is-active nginx'
ssh sg-vps 'curl --fail http://127.0.0.1:18010/health'
curl --fail https://runips.43.159.51.15.sslip.io/api/travel/v1/health
ssh sg-vps 'journalctl -u runips-travel-api.service --since today'
```

After deploying service code:

```bash
ssh sg-vps 'systemctl restart runips-travel-api.service'
```

After changing the active Nginx site, validate before reload:

```bash
nginx -t
systemctl reload nginx
```

Those two commands require administrator privileges on the server. Never place
the administrator password in this document or a repository script.

## Release and rollback procedure

The deployment uses immutable release directories selected by `current`
symlinks. A normal release should:

1. run backend unit tests, targeted lint, and a production static build;
2. scan `out/` for server-only credentials before upload;
3. upload application source/configuration into a new application release;
4. upload `out/` into a matching frontend release;
5. atomically repoint each `current` symlink;
6. restart `runips-travel-api.service` if its code or environment changed;
7. validate Nginx before reload if its configuration changed;
8. run the health, invalid-request, live-query, page, and browser checks below.

To roll back this Travel Guide deployment, retain the secret file and database,
then repoint only the two release symlinks to a known-good pair. For example,
using the documented candidate:

```bash
ln -sfn /mnt/datadisk0/runips/application/releases/20260826T105020Z \
  /mnt/datadisk0/runips/application/current.next
mv -Tf /mnt/datadisk0/runips/application/current.next \
  /mnt/datadisk0/runips/application/current

ln -sfn /mnt/datadisk0/runips/frontend/releases/20260826T105020Z \
  /mnt/datadisk0/runips/frontend/current.next
mv -Tf /mnt/datadisk0/runips/frontend/current.next \
  /mnt/datadisk0/runips/frontend/current

systemctl restart runips-travel-api.service
systemctl reload nginx
```

Run server-side administrative commands with appropriate privileges. Confirm
the target paths with `readlink -f` before changing either symlink. Do not
delete the newer release until the rollback has been verified.

If the proxy locations themselves must be removed, restore or manually compare
the Nginx backup, run `nginx -t`, and reload. Restoring the old Nginx file will
make the public travel API unavailable even if the loopback service is active.

## Verification evidence

### Automated and build checks

- `npm test` in `services/travel-api`: 6 tests passed.
- targeted ESLint for the Travel Guide and legal content: passed.
- targeted TypeScript check for the feature: passed.
- `npm run build`: Next.js 16.2.12 static export passed.
- the production `out/` tree was checked and did not contain the SerpApi key or
  server administrator credential.

### Live provider and browser check

The production check used `PEK` to `FUK` on `2026-09-20`:

- API status `200`;
- 57 normalised offers;
- 6 rendered route-pattern cards;
- selected cheapest returned pattern: `PEK — HKG — FUK`;
- selected returned price: `JP¥34,803`;
- selected real segments: `CX 395` and `CX 588`;
- generated ITA routing code: `CX395 CX588`;
- Google link hostname: `www.google.com`;
- desktop and 390-pixel mobile layouts rendered successfully;
- English-to-Chinese-to-English switching confirmed hydration;
- no browser console error or uncaught page error.

The exact results are evidence from that indexed search, not a durable fare
quote. They can change on the next provider refresh.

### Suggested repeatable release checks

```bash
cd services/travel-api && npm test
cd ../..
npx eslint src/app/travel src/features/travel-guide src/content/legal.ts
npm run build
curl --fail https://runips.43.159.51.15.sslip.io/travel/
curl --fail https://runips.43.159.51.15.sslip.io/api/travel/v1/health
```

For the live POST check, use a future date and inspect only normalised fields;
do not add the provider credential to the request. Avoid repeated uncached
queries because each can consume the shared provider allowance.

## Known limitations and next work

1. **Indexed rather than bookable inventory.** Price and availability must be
   refreshed and verified with the airline or ticket seller before payment.
2. **Provider quota.** The current free/limited SerpApi allowance can be
   exhausted. Add monitoring and choose a paid allowance before promoting the
   feature to high traffic.
3. **In-memory limits.** Cache and quotas reset on restart and are not shared if
   the service is scaled to multiple processes. Use a shared cache/limiter
   before horizontal scaling.
4. **Route-card cap.** At most eight transfer patterns are shown. The API still
   reports total normalised offer count, not omitted-group details.
5. **Fare basis.** The API does not reliably provide fare-basis codes. The ITA
   action constrains flights, not an exact fare product.
6. **Matrix URL stability.** The prefill format is not a supported RunIPS API;
   retain the visible routing code and generic fallback.
7. **Airport coordinates.** Known airports use local coordinates; an unknown
   valid airport returned by the provider uses a clearly labelled schematic
   route, not a false geographic point.
8. **Transit documents.** Current output is a risk prompt only. Definitive
   passport/visa logic needs an authoritative, maintained source and audit
   trail.
9. **Ticket protection/baggage facts.** SerpApi segments do not prove that
   separately marketed sectors share protection or through-check baggage.
   Users must confirm with the operating airlines.
10. **Local transport.** FUK/KKJ-to-campus, housing, rail, bus, taxi, disruption,
    accessibility, and late-arrival guidance remain future modules.

## Primary external references

- SerpApi Google Flights API:
  <https://serpapi.com/google-flights-api>
- SerpApi Search Archive API:
  <https://serpapi.com/search-archive-api>
- SerpApi pricing and allowance information:
  <https://serpapi.com/pricing>
- SerpApi legal and privacy documents:
  <https://serpapi.com/legal>
- Google ITA Matrix help — routing and extension codes:
  <https://support.google.com/faqs/faq/1739451?hl=en-GB>
- Google ITA Matrix help — using the interface:
  <https://support.google.com/faqs/answer/2736497?hl=en-AU>
- Google Flights developer programme, which is partner-oriented rather than a
  general public live-search API:
  <https://developers.google.com/travel/flights>

## Main-thread acceptance checklist

- Review this file before staging because the shared worktree contains many
  unrelated changes.
- Review `Header.tsx` and `legal.ts` as combined files rather than overwriting
  main-thread edits.
- Keep the secret environment file server-only and out of git.
- Do not restore the old sample itinerary factory.
- Do not send passport/ticket/baggage data to the flight API without a new
  privacy and architecture decision.
- Confirm provider allowance and alerting before public promotion.
- If changing Next.js code, follow the version-specific guides in
  `node_modules/next/dist/docs/`; this project uses breaking Next.js 16
  conventions.
