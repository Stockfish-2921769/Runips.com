import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { parseArguments, preparePilot } from './prepare-pilot.mjs';

function message(id, archive, timestamp, sender, content) {
  return {
    corpus_message_id: id,
    source_archive: archive,
    timestamp,
    sender,
    account_name: `Name for ${sender}`,
    type: 0,
    content,
  };
}

test('parseArguments uses deterministic defaults', () => {
  const parsed = parseArguments(['--input', '/tmp/messages.jsonl', '--output', '/tmp/output']);
  assert.equal(parsed.target, 260);
  assert.equal(parsed.seed, 'community-pilot-v1');
});

test('preparePilot is deterministic, stratified, bounded, and excludes identities', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'runips-pilot-'));
  const input = join(directory, 'messages.jsonl');
  const firstOutput = join(directory, 'first');
  const secondOutput = join(directory, 'second');
  const rows = [];
  for (const archive of ['group-a', 'group-b']) {
    for (let month = 0; month < 2; month += 1) {
      for (let index = 0; index < 4; index += 1) {
        const base = 1_700_000_000 + month * 2_700_000 + index * 100;
        rows.push(message(`${archive}-${month}-${index}-before`, archive, base, `${archive}-helper`, 'Useful prior answer.'));
        rows.push(message(`${archive}-${month}-${index}-question`, archive, base + 1, `${archive}-asker`, `请问第${index}个流程怎么提交？`));
        rows.push(message(`${archive}-${month}-${index}-after`, archive, base + 2, `${archive}-helper`, 'You can submit it online.'));
        rows.push(message(`${archive}-${month}-${index}-late`, archive, base + 2_000, `${archive}-late`, 'Too late for this context.'));
      }
    }
  }
  try {
    await writeFile(input, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
    await preparePilot({ input, output: firstOutput, target: 8, seed: 'fixed-seed' });
    await preparePilot({ input, output: secondOutput, target: 8, seed: 'fixed-seed' });
    const first = await readFile(join(firstOutput, 'candidates.jsonl'), 'utf8');
    const second = await readFile(join(secondOutput, 'candidates.jsonl'), 'utf8');
    assert.equal(first, second);
    const candidates = first.trim().split('\n').map(JSON.parse);
    assert.equal(candidates.length, 8);
    assert.deepEqual(new Set(candidates.map((candidate) => candidate.source_archive)), new Set(['group-a', 'group-b']));
    assert.equal(candidates.filter((candidate) => candidate.source_archive === 'group-a').length, 4);
    assert.equal(candidates.filter((candidate) => candidate.source_archive === 'group-b').length, 4);
    for (const candidate of candidates) {
      assert.equal(candidate.anchor.speaker_label, 'S1');
      assert.ok(candidate.context_before.length <= 4);
      assert.ok(candidate.context_after.length <= 24);
      assert.ok(candidate.context_before.every((row) => row.timestamp <= candidate.anchor.timestamp));
      assert.ok(candidate.context_after.every((row) => row.timestamp >= candidate.anchor.timestamp));
      assert.ok(candidate.context_after.every((row) => row.timestamp - candidate.anchor.timestamp <= 1_800));
    }
    assert.equal(first.includes('sender'), false);
    assert.equal(first.includes('account_name'), false);
    assert.equal(first.includes('group-a-asker'), false);
    const manifest = JSON.parse(await readFile(join(firstOutput, 'manifest.json'), 'utf8'));
    assert.equal(manifest.output.candidate_count, 8);
    assert.deepEqual(manifest.output.candidates_by_source_archive, { 'group-a': 4, 'group-b': 4 });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('builds context around the selected anchor by corpus ID and fails closed when absent', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'runips-pilot-context-'));
  const input = join(directory, 'messages.jsonl');
  const output = join(directory, 'output');
  const rows = [
    message('stale-before', 'group-a', -801, 'helper', 'Outside the preceding 30 minute window.'),
    message('before', 'group-a', 1_000, 'helper', 'Earlier context.'),
    message('anchor', 'group-a', 1_001, 'asker', '请问这个流程怎么提交？'),
    message('after', 'group-a', 1_002, 'helper', 'Submit it online.'),
    message('late', 'group-a', 2_802, 'helper', 'Outside the 30 minute window.'),
  ];
  try {
    await writeFile(input, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
    await preparePilot({ input, output, target: 1, seed: 'context-regression' });
    const candidates = (await readFile(join(output, 'candidates.jsonl'), 'utf8'))
      .trim()
      .split('\n')
      .map(JSON.parse);
    assert.equal(candidates.length, 1);
    const [candidate] = candidates;
    assert.equal(candidate.anchor.corpus_message_id, 'anchor');
    assert.deepEqual(candidate.context_before.map((row) => row.corpus_message_id), ['before']);
    assert.deepEqual(candidate.context_after.map((row) => row.corpus_message_id), ['after']);
    assert.ok(candidate.context_before.every((row) => row.timestamp <= candidate.anchor.timestamp));
    assert.ok(candidate.context_after.every((row) => row.timestamp >= candidate.anchor.timestamp));
    assert.ok(candidate.context_after.every((row) => row.timestamp - candidate.anchor.timestamp <= 1_800));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
