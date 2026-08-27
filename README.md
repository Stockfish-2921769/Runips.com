# RunIPS

RunIPS is an unofficial student guide for Waseda University IPS. Its current core is a professor/supervisor review experience focused on research supervision and lab life. Course reviews are intentionally kept out of this domain and can be added later as a separate module.

## Current product surface

- Supervisor and lab directory across the three IPS divisions
- English-default UI with an optional Chinese version
- Supervisor profile with overall rating, research pressure, choose-again rate, rating distribution, tags, and six mentorship dimensions
- Structured anonymous student reviews
- Optional written comments and context fields with an explicit “Not disclosed” choice
- Review sorting, student-level filtering, helpful votes, reports, and review editing
- A searchable Community for durable topics, with replies, optional accepted replies, duplicate detection, follows, private notifications, reports, and moderation
- Anonymous authentication for supervisor reviews, plus persistent Google accounts for Community participation
- Discourse-shaped Community identities with a unique username, public display name, lightweight avatar and `waseda-verified` badge
- GDPR-aligned Privacy Notice and Terms and Conditions, plus a privacy checkpoint before opening the review form
- Private in-app Contact inbox for feedback, content concerns, and privacy requests
- Self-service account and linked-data erasure
- Daily OpenAlex citation refresh with live Google Scholar links for cross-checking

## Local development

Install the locked dependencies and start Next.js:

```bash
npm ci
npm run dev
```

The frontend currently expects these public Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

The app can still be built without a local environment file. Data requests require real credentials in the browser.

## Application database

RunIPS now uses its own PostgreSQL database with a self-hosted Supabase-compatible Auth and REST layer. The SQL files in [`supabase/migrations`](supabase/migrations) are the authoritative schema history and must be applied in filename order. They provide:

- The initial 31-professor directory
- `professor_reviews`
- `professor_review_votes`
- `professor_review_reports`
- Public, privacy-safe review and summary views
- Nullable student context selected explicitly by the reviewer and 0–2,000-character written comments
- Row-level ownership rules and one-review-per-user-per-professor enforcement
- A write-only public feedback RPC backed by a non-public `feedback_submissions` inbox
- Community topics, replies, categories, follows, private notifications, reports, and a private moderator queue
- Full-database Community duplicate search, optional accepted replies, content status controls, and privacy-safe public views that never expose account UUIDs
- An authenticated, transactional account-erasure RPC
- Private account profiles, privacy-safe public member views, and server-issued Waseda email verification

Feature pages import data operations through repository modules under `src/features`. This boundary lets the REST layer be replaced by a custom backend later without rewriting the UI or domain model. Course reviews remain a separate future module.

Use [`deploy/scripts/apply-migrations.sh`](deploy/scripts/apply-migrations.sh) against the running database container. The script records applied migrations and safely skips them on later runs.

## Self-hosted deployment

The current production architecture is a static Next.js export served by Nginx, backed by PostgreSQL, Auth, and REST services on the Singapore server. Database and application state live on the server's data disk, and PostgreSQL is backed up daily with 14-day retention.

See [`deploy/README.md`](deploy/README.md) for service paths, operational commands, migration, backup, and rollback details. No credentials are stored in this repository.

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
```

The Next.js app is currently exported as static assets into `out/`.
