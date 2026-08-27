import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { parseArguments, splitPilot } from './split-pilot.mjs';

test('parseArguments uses a fixed default seed', () => {
  const parsed = parseArguments(['--input', '/tmp/candidates.jsonl', '--output', '/tmp/batches']);
  assert.equal(parsed.seed, 'community-pilot-batches-v1');
});

test('splitPilot balances every source/month stratum and copies candidates verbatim', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'runips-split-pilot-'));
  const input = join(directory, 'candidates.jsonl');
  const firstOutput = join(directory, 'first');
  const secondOutput = join(directory, 'second');
  const rows = [];
  for (const sourceArchive of ['group-a', 'group-b']) {
    for (const timeBucket of ['2026-01', '2026-02']) {
      for (let index = 0; index < 6; index += 1) {
        rows.push(JSON.stringify({
          candidate_id: `${sourceArchive}-${timeBucket}-${index}`,
          source_archive: sourceArchive,
          time_bucket: timeBucket,
          anchor: { content: `unchanged ${index}` },
        }));
      }
    }
  }
  try {
    await writeFile(input, `${rows.join('\n')}\n`);
    await splitPilot({ input, output: firstOutput, seed: 'fixed-seed' });
    await splitPilot({ input, output: secondOutput, seed: 'fixed-seed' });
    for (let index = 1; index <= 3; index += 1) {
      assert.equal(
        await readFile(join(firstOutput, `batch-${index}.jsonl`), 'utf8'),
        await readFile(join(secondOutput, `batch-${index}.jsonl`), 'utf8'),
      );
    }
    const batches = await Promise.all(
      [1, 2, 3].map(async (index) =>
        (await readFile(join(firstOutput, `batch-${index}.jsonl`), 'utf8'))
          .trim()
          .split('\n'),
      ),
    );
    assert.deepEqual(new Set(batches.flat()), new Set(rows));
    assert.deepEqual(batches.map((batch) => batch.length), [8, 8, 8]);
    for (const batch of batches) {
      const parsed = batch.map(JSON.parse);
      for (const sourceArchive of ['group-a', 'group-b']) {
        for (const timeBucket of ['2026-01', '2026-02']) {
          assert.equal(parsed.filter((row) => row.source_archive === sourceArchive && row.time_bucket === timeBucket).length, 2);
        }
      }
    }
    const manifest = JSON.parse(await readFile(join(firstOutput, 'manifest.json'), 'utf8'));
    assert.equal(manifest.outputs.batch_1.candidate_count, 8);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
