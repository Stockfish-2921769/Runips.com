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
const BATCH_COUNT = 3;
const DEFAULT_SEED = 'community-pilot-batches-v1';

function printUsage() {
  console.log(`Usage:
  node scripts/community-import/split-pilot.mjs \\
    --input .local/community-import/pilot-YYYY-MM-DD/candidates.jsonl \\
    --output .local/community-import/pilot-YYYY-MM-DD/agent-batches [--seed SEED]

The output directory is created once and is never overwritten.`);
}

export function parseArguments(argv) {
  const result = { help: false, input: undefined, output: undefined, seed: DEFAULT_SEED };
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
        argument === '--seed' ? value : resolve(value);
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }
  return result;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function pathExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function parseCandidates(raw) {
  const rows = [];
  const seen = new Set();
  for (const [index, line] of raw.toString('utf8').split(/\r?\n/u).entries()) {
    if (!line.trim()) continue;
    let candidate;
    try {
      candidate = JSON.parse(line);
    } catch (error) {
      throw new Error(`Input line ${index + 1} is not valid JSON: ${error.message}`);
    }
    if (
      typeof candidate.candidate_id !== 'string' ||
      typeof candidate.source_archive !== 'string' ||
      typeof candidate.time_bucket !== 'string'
    ) {
      throw new Error(`Input line ${index + 1} lacks candidate_id, source_archive, or time_bucket.`);
    }
    if (seen.has(candidate.candidate_id)) {
      throw new Error(`Input line ${index + 1} repeats candidate_id ${candidate.candidate_id}.`);
    }
    seen.add(candidate.candidate_id);
    rows.push({
      candidateId: candidate.candidate_id,
      sourceArchive: candidate.source_archive,
      timeBucket: candidate.time_bucket,
      line,
    });
  }
  return rows;
}

function splitCandidates(rows, seed) {
  const strata = new Map();
  for (const row of rows) {
    const key = `${row.sourceArchive}\0${row.timeBucket}`;
    const group = strata.get(key) ?? [];
    group.push(row);
    strata.set(key, group);
  }
  const batches = Array.from({ length: BATCH_COUNT }, () => []);
  for (const [key, group] of [...strata.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    group.sort(
      (left, right) =>
        sha256(`${seed}\0${left.candidateId}`).localeCompare(
          sha256(`${seed}\0${right.candidateId}`),
        ) || left.candidateId.localeCompare(right.candidateId),
    );
    const preferredOffset =
      Number.parseInt(sha256(`${seed}\0${key}`).slice(0, 8), 16) % BATCH_COUNT;
    let offset = preferredOffset;
    let bestScore;
    for (let shift = 0; shift < BATCH_COUNT; shift += 1) {
      const candidateOffset = (preferredOffset + shift) % BATCH_COUNT;
      const proposedSizes = batches.map((batch) => batch.length);
      group.forEach((_, index) => {
        proposedSizes[(candidateOffset + index) % BATCH_COUNT] += 1;
      });
      const range = Math.max(...proposedSizes) - Math.min(...proposedSizes);
      const squareSum = proposedSizes.reduce((total, size) => total + size ** 2, 0);
      const score = [range, squareSum];
      if (
        !bestScore ||
        score[0] < bestScore[0] ||
        (score[0] === bestScore[0] && score[1] < bestScore[1])
      ) {
        offset = candidateOffset;
        bestScore = score;
      }
    }
    group.forEach((row, index) => batches[(offset + index) % BATCH_COUNT].push(row));
  }
  for (const batch of batches) {
    batch.sort((left, right) => left.candidateId.localeCompare(right.candidateId));
  }
  return batches;
}

function batchCounts(rows) {
  const bySource = {};
  const byTimeBucket = {};
  for (const row of rows) {
    bySource[row.sourceArchive] = (bySource[row.sourceArchive] ?? 0) + 1;
    byTimeBucket[row.timeBucket] = (byTimeBucket[row.timeBucket] ?? 0) + 1;
  }
  return {
    candidate_count: rows.length,
    candidates_by_source_archive: Object.fromEntries(Object.entries(bySource).sort()),
    candidates_by_time_bucket: Object.fromEntries(Object.entries(byTimeBucket).sort()),
  };
}

export async function splitPilot({ input, output, seed = DEFAULT_SEED }) {
  if (!input) throw new Error('Provide --input CANDIDATES_JSONL.');
  if (!output) throw new Error('Provide --output DIRECTORY.');
  if (await pathExists(output)) throw new Error(`Output already exists: ${output}`);
  const raw = await readFile(input);
  const rows = parseCandidates(raw);
  const batches = splitCandidates(rows, seed);
  await mkdir(dirname(output), { recursive: true });
  const temporaryDirectory = await mkdtemp(join(dirname(output), '.split-pilot-'));
  const manifest = {
    schema_version: SCHEMA_VERSION,
    input: {
      file_name: input.split('/').pop(),
      sha256: sha256(raw),
      candidate_count: rows.length,
    },
    selection: {
      seed,
      strategy: 'within each source_archive and time_bucket stratum, sort by seeded SHA-256(candidate_id) and assign with a seeded three-way round-robin offset chosen to minimize cumulative batch imbalance',
    },
    outputs: Object.fromEntries(
      batches.map((batch, index) => [
        `batch_${index + 1}`,
        { file: `batch-${index + 1}.jsonl`, ...batchCounts(batch) },
      ]),
    ),
    notes: [
      'Candidate JSON lines are copied verbatim; this stage does not alter candidate content.',
      'Each source/month stratum is distributed across all three batches as evenly as its size permits.',
    ],
  };
  try {
    await Promise.all([
      ...batches.map((batch, index) =>
        writeFile(
          join(temporaryDirectory, `batch-${index + 1}.jsonl`),
          batch.length ? `${batch.map((row) => row.line).join('\n')}\n` : '',
        ),
      ),
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
  const manifest = await splitPilot(arguments_);
  console.log(
    JSON.stringify(
      {
        output: arguments_.output,
        batches: Object.values(manifest.outputs).map((batch) => batch.candidate_count),
      },
      null,
      2,
    ),
  );
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
