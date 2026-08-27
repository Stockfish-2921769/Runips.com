# Community archive import

This pipeline turns multiple ChatLab JSONL exports into one private, traceable
corpus before question extraction, semantic matching, or LLM synthesis.

## Stage 1: merge the source archives

Run the merger with a stable label for each source group:

```bash
npm run community:merge-chats -- \
  --input group-a=/absolute/path/to/first.jsonl \
  --input group-b=/absolute/path/to/second.jsonl \
  --output .local/community-import/two-groups-YYYY-MM-DD
```

The output directory is new-only: the command refuses to overwrite it. The
entire `.local/community-import/` tree is ignored by Git because it contains
raw group-chat data.

The merger produces:

- `messages.jsonl`: every message, ordered by time, with its source archive,
  source line, source message ID, and a stable corpus message ID;
- `participants.jsonl`: participants merged by platform ID, with all observed
  display names and source groups;
- `exact-duplicate-groups.jsonl`: high-confidence duplicates posted in more
  than one source group; and
- `manifest.json`: input hashes, counts, time ranges, and output schema version.

Messages in an exact-duplicate group are deliberately retained. Removing one
would destroy its group-specific neighbouring messages, which are needed to
reconstruct possible answers later.

## Planned downstream stages

1. Detect candidate questions and build a group-local question episode from
   the surrounding conversation.
2. Embed each episode and retrieve a small set of possible duplicate topics
   across both groups.
3. Ask an LLM to classify each candidate pair as the same intent, related, or
   different, while preserving intake year and other time-dependent details.
4. Synthesise one canonical topic and replies only from cited source-message
   evidence.
5. Review the candidate in a private queue before publishing it with
   `source_type = 'wechat_archive'`.

Embedding similarity is a retrieval signal, not an automatic merge decision.
This avoids transitive cluster errors where A resembles B and B resembles C,
but A and C are materially different questions.
