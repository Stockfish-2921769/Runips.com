#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCHEMA_VERSION = 1;
const SOURCE_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const TEXT_MESSAGE_TYPES = new Set([0, 25]);

function printUsage() {
  console.log(`Usage:
  node scripts/community-import/merge-chatlab.mjs \\
    --input LABEL=/absolute/path/to/chat.jsonl \\
    --input LABEL=/absolute/path/to/another-chat.jsonl \\
    --output .local/community-import/CORPUS_NAME

The command creates a new output directory and refuses to overwrite an existing one.`);
}

export function parseArguments(argv) {
  const inputs = [];
  let output;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--help' || argument === '-h') {
      return { help: true, inputs, output };
    }

    if (argument === '--input') {
      const value = argv[index + 1];
      if (!value) throw new Error('--input requires LABEL=PATH.');
      index += 1;
      const separator = value.indexOf('=');
      if (separator <= 0 || separator === value.length - 1) {
        throw new Error(`Invalid --input value: ${value}. Expected LABEL=PATH.`);
      }
      inputs.push({
        label: value.slice(0, separator),
        path: resolve(value.slice(separator + 1)),
      });
      continue;
    }

    if (argument === '--output') {
      const value = argv[index + 1];
      if (!value) throw new Error('--output requires a directory path.');
      index += 1;
      output = resolve(value);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return { help: false, inputs, output };
}

function validateArguments({ inputs, output }) {
  if (inputs.length < 2) {
    throw new Error('Provide at least two --input LABEL=PATH arguments.');
  }
  if (!output) throw new Error('Provide --output DIRECTORY.');

  const labels = new Set();
  for (const input of inputs) {
    if (!SOURCE_LABEL_PATTERN.test(input.label)) {
      throw new Error(
        `Invalid source label "${input.label}". Use lowercase letters, digits, and hyphens.`,
      );
    }
    if (labels.has(input.label)) {
      throw new Error(`Duplicate source label: ${input.label}`);
    }
    labels.add(input.label);
  }
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

function stableMessageId(sourceArchive, sourceMessageId) {
  return `cam_${sha256(`${sourceArchive}\0${sourceMessageId}`).slice(0, 24)}`;
}

function exactDuplicateFingerprint(message) {
  if (!TEXT_MESSAGE_TYPES.has(message.type)) return null;

  const content = normaliseText(message.content);
  if (!content) return null;

  return sha256(
    JSON.stringify([
      message.timestamp,
      message.type,
      message.sender,
      content,
      message.chat_records,
    ]),
  );
}

function parseJsonLines(raw, sourceFile) {
  const rows = [];
  const lines = raw.toString('utf8').split(/\r?\n/u);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;

    try {
      rows.push({ line: index + 1, value: JSON.parse(line) });
    } catch (error) {
      throw new Error(
        `${sourceFile}:${index + 1} is not valid JSON: ${error.message}`,
      );
    }
  }

  return rows;
}

function addParticipant(participants, participantId, accountName, sourceArchive) {
  if (typeof participantId !== 'string' || !participantId.trim()) return;

  const current = participants.get(participantId) ?? {
    participant_id: participantId,
    account_names: new Set(),
    source_archives: new Set(),
  };

  if (typeof accountName === 'string' && accountName.trim()) {
    current.account_names.add(accountName);
  }
  current.source_archives.add(sourceArchive);
  participants.set(participantId, current);
}

async function readArchive(input, sourceIndex, participants) {
  const sourceStats = await stat(input.path);
  if (!sourceStats.isFile()) throw new Error(`${input.path} is not a file.`);

  const raw = await readFile(input.path);
  const rows = parseJsonLines(raw, basename(input.path));
  const recordCounts = {};
  const seenMessageIds = new Set();
  const messages = [];
  let headerCount = 0;

  for (const row of rows) {
    const type = row.value?._type;
    recordCounts[type ?? 'unknown'] = (recordCounts[type ?? 'unknown'] ?? 0) + 1;

    if (type === 'header') {
      headerCount += 1;
      continue;
    }

    if (type === 'member') {
      addParticipant(
        participants,
        row.value.platformId,
        row.value.accountName,
        input.label,
      );
      continue;
    }

    if (type !== 'message') continue;

    const sourceMessageId = row.value.platformMessageId;
    if (typeof sourceMessageId !== 'string' || !sourceMessageId.trim()) {
      throw new Error(
        `${basename(input.path)}:${row.line} has no string platformMessageId.`,
      );
    }
    if (seenMessageIds.has(sourceMessageId)) {
      throw new Error(
        `${basename(input.path)}:${row.line} repeats platformMessageId within one archive.`,
      );
    }
    seenMessageIds.add(sourceMessageId);

    const timestamp = Number(row.value.timestamp);
    if (!Number.isInteger(timestamp) || timestamp <= 0) {
      throw new Error(
        `${basename(input.path)}:${row.line} has an invalid timestamp.`,
      );
    }

    const message = {
      corpus_message_id: stableMessageId(input.label, sourceMessageId),
      source_archive: input.label,
      source_file: basename(input.path),
      source_line: row.line,
      source_message_id: sourceMessageId,
      timestamp,
      sender: typeof row.value.sender === 'string' ? row.value.sender : null,
      account_name:
        typeof row.value.accountName === 'string' ? row.value.accountName : null,
      type: Number(row.value.type),
      content: typeof row.value.content === 'string' ? row.value.content : '',
      chat_records: Array.isArray(row.value.chatRecords)
        ? row.value.chatRecords
        : [],
      exact_duplicate_group_id: null,
      _source_index: sourceIndex,
    };

    addParticipant(
      participants,
      message.sender,
      message.account_name,
      input.label,
    );
    messages.push(message);
  }

  if (headerCount !== 1) {
    throw new Error(
      `${basename(input.path)} contains ${headerCount} header rows; expected exactly one.`,
    );
  }

  const timestamps = messages.map((message) => message.timestamp);
  return {
    source: {
      label: input.label,
      file_name: basename(input.path),
      bytes: sourceStats.size,
      sha256: sha256(raw),
      record_count: rows.length,
      record_counts: recordCounts,
      message_count: messages.length,
      first_message_at:
        timestamps.length > 0
          ? new Date(Math.min(...timestamps) * 1000).toISOString()
          : null,
      last_message_at:
        timestamps.length > 0
          ? new Date(Math.max(...timestamps) * 1000).toISOString()
          : null,
    },
    messages,
  };
}

function markExactCrossArchiveDuplicates(messages) {
  const candidates = new Map();

  for (const message of messages) {
    const fingerprint = exactDuplicateFingerprint(message);
    if (!fingerprint) continue;
    const group = candidates.get(fingerprint) ?? [];
    group.push(message);
    candidates.set(fingerprint, group);
  }

  const groups = [];
  for (const [fingerprint, group] of candidates) {
    if (new Set(group.map((message) => message.source_archive)).size < 2) {
      continue;
    }

    const duplicateGroupId = `cad_${fingerprint.slice(0, 24)}`;
    for (const message of group) {
      message.exact_duplicate_group_id = duplicateGroupId;
    }
    groups.push({
      exact_duplicate_group_id: duplicateGroupId,
      corpus_message_ids: group
        .map((message) => message.corpus_message_id)
        .sort(),
      source_archives: [...new Set(group.map((message) => message.source_archive))].sort(),
    });
  }

  groups.sort((left, right) =>
    left.exact_duplicate_group_id.localeCompare(right.exact_duplicate_group_id),
  );
  return groups;
}

function serialiseMessage(message) {
  const publicMessage = { ...message };
  delete publicMessage._source_index;
  return publicMessage;
}

function toJsonLines(rows) {
  if (rows.length === 0) return '';
  return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
}

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function mergeChatlabArchives({ inputs, output }) {
  validateArguments({ inputs, output });
  if (await pathExists(output)) {
    throw new Error(`Output already exists: ${output}`);
  }

  const participants = new Map();
  const archives = [];

  for (let index = 0; index < inputs.length; index += 1) {
    archives.push(await readArchive(inputs[index], index, participants));
  }

  const messages = archives.flatMap((archive) => archive.messages);
  messages.sort(
    (left, right) =>
      left.timestamp - right.timestamp ||
      left._source_index - right._source_index ||
      left.source_line - right.source_line,
  );

  const duplicateGroups = markExactCrossArchiveDuplicates(messages);
  const participantRows = [...participants.values()]
    .map((participant) => ({
      participant_id: participant.participant_id,
      account_names: [...participant.account_names].sort(),
      source_archives: [...participant.source_archives].sort(),
    }))
    .sort((left, right) => left.participant_id.localeCompare(right.participant_id));

  const manifest = {
    schema_version: SCHEMA_VERSION,
    created_at: new Date().toISOString(),
    sources: archives.map((archive) => archive.source),
    corpus: {
      message_count: messages.length,
      participant_count: participantRows.length,
      text_message_count: messages.filter(
        (message) =>
          TEXT_MESSAGE_TYPES.has(message.type) && normaliseText(message.content),
      ).length,
      exact_cross_archive_duplicate_group_count: duplicateGroups.length,
      exact_cross_archive_duplicate_message_count: duplicateGroups.reduce(
        (total, group) => total + group.corpus_message_ids.length,
        0,
      ),
    },
    outputs: {
      messages: 'messages.jsonl',
      participants: 'participants.jsonl',
      exact_duplicate_groups: 'exact-duplicate-groups.jsonl',
    },
    notes: [
      'All source messages are retained so that group-specific conversational context remains intact.',
      'exact_duplicate_group_id marks high-confidence cross-archive duplicates; it does not remove them.',
      'Absolute input paths and source header metadata are deliberately omitted.',
    ],
  };

  const outputParent = dirname(output);
  await mkdir(outputParent, { recursive: true });
  const temporaryDirectory = await mkdtemp(join(outputParent, '.merge-'));

  try {
    await Promise.all([
      writeFile(
        join(temporaryDirectory, 'messages.jsonl'),
        toJsonLines(messages.map(serialiseMessage)),
      ),
      writeFile(
        join(temporaryDirectory, 'participants.jsonl'),
        toJsonLines(participantRows),
      ),
      writeFile(
        join(temporaryDirectory, 'exact-duplicate-groups.jsonl'),
        toJsonLines(duplicateGroups),
      ),
      writeFile(
        join(temporaryDirectory, 'manifest.json'),
        `${JSON.stringify(manifest, null, 2)}\n`,
      ),
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
  if (arguments_.help) {
    printUsage();
    return;
  }

  const manifest = await mergeChatlabArchives(arguments_);
  console.log(
    JSON.stringify(
      {
        output: arguments_.output,
        sources: manifest.sources.length,
        messages: manifest.corpus.message_count,
        participants: manifest.corpus.participant_count,
        exact_duplicate_groups:
          manifest.corpus.exact_cross_archive_duplicate_group_count,
      },
      null,
      2,
    ),
  );
}

const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
