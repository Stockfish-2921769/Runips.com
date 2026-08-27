# Community import pilot: Claude Code handoff

Status date: 2026-08-26

This handoff assigns only the evidence-extraction stage of the RunIPS Community
archive pilot to Claude Code. The intended workers are Claude Haiku agents. They
must follow the deterministic `qe.v1` contract and must not publish anything,
write to the database, search the web, or fill gaps from model knowledge.

## Scope and ownership

This is a **260-candidate pilot**, not a full-corpus import.

- The merged private corpus contains 56,403 messages from two source groups.
- The corrected pilot contains 260 stratified candidates: 130 from each group.
- Claude Code owns: converting every corrected candidate into one `qe.v1` JSON
  object and writing the raw result shards described below.
- Codex owns: deterministic validation, local embeddings, duplicate retrieval,
  stronger-model adjudication/synthesis, automatic safety gates, and any later
  database work.
- No output from this handoff is authorised for production publication.

Do not use the old directory `.local/community-import/pilot-2026-08-26/`. Its
candidate context was generated with an object-identity indexing bug, so all
Episode outputs under that directory are superseded and must be ignored.

## Authoritative inputs

Read the extraction contract completely before processing any candidate:

```text
docs/COMMUNITY_EPISODE_AGENT_SPEC.md
```

Use only these corrected input batches:

```text
.local/community-import/pilot-2026-08-26-v2/agent-batches/batch-1.jsonl  # 87
.local/community-import/pilot-2026-08-26-v2/agent-batches/batch-2.jsonl  # 86
.local/community-import/pilot-2026-08-26-v2/agent-batches/batch-3.jsonl  # 87
```

The SHA-256 checksums are:

```text
12073fbee15b9a94eff557ab09cc29c0aab2323b6a21c821d97bbd6947ebba00  batch-1.jsonl
245914888d3fcffce0353c84199419b9a3360520dff13308de750fe54e2416c5  batch-2.jsonl
a589afda5ebc4b228c72c3e2be298bf74495d41c6dca239abbb318fe50fc1c35  batch-3.jsonl
```

Do not read `messages.jsonl`, `participants.jsonl`, the original Downloads
files, or any candidate outside the worker's assigned line range. Every allowed
evidence ID already appears in that candidate's `anchor`, `context_before`, or
`context_after`.

## Work partition

Use one Haiku worker per shard, in as many concurrent waves as Claude Code can
safely support. A worker must read at most the assigned 15 candidate lines. No
two workers may write the same file.

| Input | Line ranges |
| --- | --- |
| `batch-1.jsonl` | `001-015`, `016-030`, `031-045`, `046-060`, `061-075`, `076-087` |
| `batch-2.jsonl` | `001-015`, `016-030`, `031-045`, `046-060`, `061-075`, `076-086` |
| `batch-3.jsonl` | `001-015`, `016-030`, `031-045`, `046-060`, `061-075`, `076-087` |

Write only to this new directory:

```text
.local/community-import/pilot-2026-08-26-v2/episodes/claude-raw/
```

Name each output after its source and inclusive line range, for example:

```text
batch-1-lines-001-015.jsonl
batch-2-lines-076-086.jsonl
```

Each output must contain exactly one compact JSON object per input line, in the
same order. It must not contain Markdown fences, prose, blank records, progress
logs, or a summary. Worker status summaries belong in the Claude Code console,
not in JSONL files.

## Worker prompt

Pass the full specification plus the following fixed instruction to every
Haiku worker:

```text
You are a RunIPS qe.v1 evidence extractor. Read
docs/COMMUNITY_EPISODE_AGENT_SPEC.md completely, then process only the assigned
inclusive line range from the assigned corrected pilot-v2 batch.

For each input candidate, emit exactly one single-line qe.v1 JSON object, in the
same order. Return candidate_id unchanged and mechanically replace cpc_ with qe_
for episode_id. Use only the candidate's anchor/context_before/context_after.
Never inspect another file or use web/world knowledge. Every claim and evidence
ID must be supported inside that candidate window. Never output sender,
account_name, platform IDs, names of private people, contact details, source
links, or long quotations. Preserve public institutional names only when needed
to state the question. If evidence is incomplete, mark unanswered/hold; never
guess. If the candidate is not a real reconstructable question, mark
invalid/reject. Apply temporal, media, conflict, privacy, confidence, and
accept/hold/reject gates exactly as specified. Do not inflate scores to increase
acceptance. Output JSONL only to the assigned unique file and do not modify any
repository source or documentation file.
```

## Non-negotiable invariants

- Exactly 260 input candidates must yield exactly 260 output objects.
- `candidate_id` is copied exactly; `episode_id` is its mechanical `qe_` form.
- A candidate can be valid and unanswered. In that case it should normally be
  `hold`; do not invent an answer merely to obtain `accept`.
- All message IDs must be from the same candidate window and source group.
- Cross-group or cross-candidate duplicates are not merged by Haiku.
- `overall` equals the minimum of the five component confidence values.
- `accept` is only an extraction quality signal. It never means “publish”.
- Valid `hold` Episodes remain useful for semantic retrieval, but are not
  automatically publishable.
- Do not alter or remove the superseded pilot directory; simply ignore it.

## Claude-side completion checks

Before handing control back, check all 18 expected files without printing raw
chat content:

1. Every non-empty line parses as one JSON object.
2. Output line count equals the assigned input line count.
3. Candidate IDs match the assigned input range in the same order.
4. No output contains the keys `sender`, `account_name`, `source_message_id`,
   `source_file`, or `source_line`.
5. Report only file names, counts, and pass/fail results to Codex.

Do not concatenate or rewrite the shards. Codex will ingest the ordered shard
set with `scripts/community-import/validate-episodes.mjs`, retain traceable
excluded records, and run the pinned local multilingual E5 embedding model.

## Return message to Codex

Use this concise form:

```text
Claude extraction complete.
Output directory: .local/community-import/pilot-2026-08-26-v2/episodes/claude-raw
Files: 18
Objects: 260
Parse/order/ID/forbidden-key checks: PASS
Counts: valid=<n>, invalid=<n>, accept=<n>, hold=<n>, reject=<n>
No repository source files or production services were changed.
```

If any invariant fails, stop and report the affected shard and line number. Do
not silently repair an unrelated worker's output and do not proceed to database
import.
