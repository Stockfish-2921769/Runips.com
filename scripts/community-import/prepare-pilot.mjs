#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 1;
const DEFAULT_TARGET = 260;
const DEFAULT_SEED = 'community-pilot-v1';
const TEXT_MESSAGE_TYPES = new Set([0, 25]);
const FOLLOWING_LIMIT = 24;
const PRECEDING_LIMIT = 4;
const PRECEDING_SECONDS = 30 * 60;
const FOLLOWING_SECONDS = 30 * 60;

function printUsage() {
  console.log(`Usage:
  node scripts/community-import/prepare-pilot.mjs \\
    --input .local/community-import/CORPUS/messages.jsonl \\
    --output .local/community-import/pilot-YYYY-MM-DD [--target 260] [--seed SEED]

The output directory is created once and is never overwritten.`);
}

export function parseArguments(argv) {
  const result = {
    help: false,
    input: undefined,
    output: undefined,
    target: DEFAULT_TARGET,
    seed: DEFAULT_SEED,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      result.help = true;
      continue;
    }
    if (argument === '--input' || argument === '--output' || argument === '--seed') {
      const value = argv[index + 1];
      if (!value) throw new Error(`${argument} requires a value.`);
      index += 1;
      result[argument.slice(2)] =
        argument === '--input' || argument === '--output' ? resolve(value) : value;
      continue;
    }
    if (argument === '--target') {
      const value = Number(argv[index + 1]);
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new Error('--target requires a positive integer.');
      }
      index += 1;
      result.target = value;
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}

function normaliseText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/\s+/gu, ' ')
    .trim();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function toJsonLines(rows) {
  return rows.length ? `${rows.map((row) => JSON.stringify(row)).join('\n')}\n` : '';
}

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function monthBucket(timestamp) {
  return new Date(timestamp * 1000).toISOString().slice(0, 7);
}

function questionScore(content) {
  let score = 0;
  if (/[?？]/u.test(content)) score += 5;
  if (
    /(?:请问|请教|想问|有人知道|有谁知道|怎么|如何|为什么|多少|几点|哪里|哪儿|能否|可以|是否|吗|呢|哪位|哪个|什么时候|怎么办|求问)/u.test(
      content,
    )
  ) {
    score += 4;
  }
  if (
    /^(?:how|what|when|where|who|why|can|could|would|should|is|are|do|does|did|anyone|has anyone|which|whether)\b/iu.test(
      content,
    )
  ) {
    score += 4;
  }
  if (content.length >= 12) score += 1;
  if (content.length >= 30) score += 1;
  return score;
}

function stableOrder(seed, message) {
  return sha256(`${seed}\0${message.corpus_message_id}`);
}

function allocateEvenly(buckets, total) {
  const allocation = new Map(buckets.map((bucket) => [bucket.key, 0]));
  let remaining = total;
  while (remaining > 0) {
    let changed = false;
    for (const bucket of buckets) {
      if (remaining === 0) break;
      if (allocation.get(bucket.key) < bucket.rows.length) {
        allocation.set(bucket.key, allocation.get(bucket.key) + 1);
        remaining -= 1;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return allocation;
}

function selectAnchors(messages, target, seed) {
  const candidates = messages
    .filter((message) => message.is_text && message.question_score >= 4)
    .map((message) => ({
      ...message,
      _rank: stableOrder(seed, message),
    }));
  if (candidates.length < target) {
    throw new Error(`Only ${candidates.length} question candidates are available; target is ${target}.`);
  }

  const byArchive = new Map();
  for (const candidate of candidates) {
    const rows = byArchive.get(candidate.source_archive) ?? [];
    rows.push(candidate);
    byArchive.set(candidate.source_archive, rows);
  }
  const archives = [...byArchive.keys()].sort();
  const archiveBuckets = archives.map((sourceArchive) => ({
    key: sourceArchive,
    rows: byArchive.get(sourceArchive),
  }));
  const archiveAllocation = allocateEvenly(archiveBuckets, target);
  const selected = [];

  for (const archive of archiveBuckets) {
    const byMonth = new Map();
    for (const candidate of archive.rows) {
      const bucket = monthBucket(candidate.timestamp);
      const rows = byMonth.get(bucket) ?? [];
      rows.push(candidate);
      byMonth.set(bucket, rows);
    }
    const monthBuckets = [...byMonth.entries()]
      .map(([key, rows]) => ({ key, rows }))
      .sort((left, right) => left.key.localeCompare(right.key));
    const monthAllocation = allocateEvenly(
      monthBuckets,
      archiveAllocation.get(archive.key),
    );
    for (const bucket of monthBuckets) {
      bucket.rows.sort(
        (left, right) =>
          right.question_score - left.question_score ||
          left._rank.localeCompare(right._rank) ||
          left.corpus_message_id.localeCompare(right.corpus_message_id),
      );
      selected.push(...bucket.rows.slice(0, monthAllocation.get(bucket.key)));
    }
  }
  return selected.sort(
    (left, right) =>
      left.timestamp - right.timestamp ||
      left.source_archive.localeCompare(right.source_archive) ||
      left.corpus_message_id.localeCompare(right.corpus_message_id),
  );
}

function publicMessage(message, speakerLabel) {
  return {
    corpus_message_id: message.corpus_message_id,
    timestamp: message.timestamp,
    source_archive: message.source_archive,
    content: message.content,
    speaker_label: speakerLabel,
  };
}

function buildCandidate(anchor, messagesByArchive) {
  const groupMessages = messagesByArchive.get(anchor.source_archive);
  // selectAnchors decorates candidates with a rank, so the selected object is
  // not necessarily the same reference as the parsed message in this array.
  // Locate it by the stable corpus ID instead of object identity.
  const anchorIndex = groupMessages.findIndex(
    (message) => message.corpus_message_id === anchor.corpus_message_id,
  );
  if (anchorIndex < 0) {
    throw new Error(`Selected anchor ${anchor.corpus_message_id} was not found in its source archive.`);
  }
  const preceding = [];
  for (let index = anchorIndex - 1; index >= 0 && preceding.length < PRECEDING_LIMIT; index -= 1) {
    if (groupMessages[index].timestamp < anchor.timestamp - PRECEDING_SECONDS) break;
    if (groupMessages[index].is_text) preceding.unshift(groupMessages[index]);
  }
  const following = [];
  for (let index = anchorIndex + 1; index < groupMessages.length && following.length < FOLLOWING_LIMIT; index += 1) {
    const message = groupMessages[index];
    if (message.timestamp > anchor.timestamp + FOLLOWING_SECONDS) break;
    if (message.is_text) following.push(message);
  }
  const speakerLabels = new Map([[anchor._speaker_key, 'S1']]);
  for (const message of [...preceding, ...following]) {
    if (!speakerLabels.has(message._speaker_key)) {
      speakerLabels.set(message._speaker_key, `S${speakerLabels.size + 1}`);
    }
  }
  const labelFor = (message) => speakerLabels.get(message._speaker_key);
  return {
    candidate_id: `cpc_${sha256(anchor.corpus_message_id).slice(0, 24)}`,
    source_archive: anchor.source_archive,
    time_bucket: monthBucket(anchor.timestamp),
    question_score: anchor.question_score,
    anchor: publicMessage(anchor, labelFor(anchor)),
    context_before: preceding.map((message) => publicMessage(message, labelFor(message))),
    context_after: following.map((message) => publicMessage(message, labelFor(message))),
  };
}

function parseMessages(raw) {
  const messages = [];
  for (const [index, line] of raw.toString('utf8').split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    let value;
    try {
      value = JSON.parse(line);
    } catch (error) {
      throw new Error(`Input line ${index + 1} is not valid JSON: ${error.message}`);
    }
    if (
      typeof value.corpus_message_id !== 'string' ||
      typeof value.source_archive !== 'string' ||
      !Number.isInteger(value.timestamp)
    ) {
      throw new Error(`Input line ${index + 1} lacks required corpus message fields.`);
    }
    const content = normaliseText(value.content);
    const isText = TEXT_MESSAGE_TYPES.has(value.type) && Boolean(content);
    messages.push({
      corpus_message_id: value.corpus_message_id,
      source_archive: value.source_archive,
      timestamp: value.timestamp,
      content,
      is_text: isText,
      question_score: isText ? questionScore(content) : 0,
      _speaker_key:
        typeof value.sender === 'string' && value.sender
          ? value.sender
          : `missing-sender:${value.corpus_message_id}`,
    });
  }
  messages.sort(
    (left, right) =>
      left.timestamp - right.timestamp ||
      left.source_archive.localeCompare(right.source_archive) ||
      left.corpus_message_id.localeCompare(right.corpus_message_id),
  );
  return messages;
}

export async function preparePilot({ input, output, target = DEFAULT_TARGET, seed = DEFAULT_SEED }) {
  if (!input) throw new Error('Provide --input MESSAGES_JSONL.');
  if (!output) throw new Error('Provide --output DIRECTORY.');
  if (await pathExists(output)) throw new Error(`Output already exists: ${output}`);
  const raw = await readFile(input);
  const messages = parseMessages(raw);
  const messagesByArchive = new Map();
  for (const message of messages) {
    const rows = messagesByArchive.get(message.source_archive) ?? [];
    rows.push(message);
    messagesByArchive.set(message.source_archive, rows);
  }
  const anchors = selectAnchors(messages, target, seed);
  const candidates = anchors.map((anchor) => buildCandidate(anchor, messagesByArchive));
  const candidatesByArchive = Object.fromEntries(
    [...messagesByArchive.keys()].sort().map((archive) => [
      archive,
      candidates.filter((candidate) => candidate.source_archive === archive).length,
    ]),
  );
  const candidatesByMonth = Object.fromEntries(
    [...new Set(candidates.map((candidate) => candidate.time_bucket))]
      .sort()
      .map((bucket) => [
        bucket,
        candidates.filter((candidate) => candidate.time_bucket === bucket).length,
      ]),
  );
  const manifest = {
    schema_version: SCHEMA_VERSION,
    input: {
      file_name: input.split('/').pop(),
      sha256: sha256(raw),
      message_count: messages.length,
    },
    selection: {
      target,
      seed,
      eligible_question_count: messages.filter((message) => message.is_text && message.question_score >= 4).length,
      strategy: 'equal source-archive allocation, then equal calendar-month allocation; within each stratum use question score then seeded SHA-256 ordering',
    },
    output: {
      candidates: 'candidates.jsonl',
      candidate_count: candidates.length,
      candidates_by_source_archive: candidatesByArchive,
      candidates_by_time_bucket: candidatesByMonth,
    },
    privacy: {
      excluded_fields: ['sender', 'account_name', 'source_message_id', 'source_file', 'source_line'],
      speaker_labels: 'Per-candidate S1, S2, ... labels; S1 is the anchor speaker.',
    },
    context: {
      preceding_text_limit: PRECEDING_LIMIT,
      preceding_time_limit_seconds: PRECEDING_SECONDS,
      following_text_limit: FOLLOWING_LIMIT,
      following_time_limit_seconds: FOLLOWING_SECONDS,
    },
  };
  await mkdir(dirname(output), { recursive: true });
  const temporaryDirectory = await mkdtemp(join(dirname(output), '.prepare-pilot-'));
  try {
    await Promise.all([
      writeFile(join(temporaryDirectory, 'candidates.jsonl'), toJsonLines(candidates)),
      writeFile(join(temporaryDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`),
    ]);
    await rename(temporaryDirectory, output);
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
  return manifest;
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  if (arguments_.help) return printUsage();
  const manifest = await preparePilot(arguments_);
  console.log(JSON.stringify({ output: arguments_.output, candidates: manifest.output.candidate_count }, null, 2));
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
