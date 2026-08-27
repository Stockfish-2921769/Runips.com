import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  mergeChatlabArchives,
  parseArguments,
} from './merge-chatlab.mjs';

function jsonLines(rows) {
  return `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`;
}

test('parseArguments accepts labelled input paths containing spaces', () => {
  const parsed = parseArguments([
    '--input',
    'group-a=/tmp/first group.jsonl',
    '--input',
    'group-b=/tmp/second.jsonl',
    '--output',
    '/tmp/output',
  ]);

  assert.deepEqual(
    parsed.inputs.map((input) => input.label),
    ['group-a', 'group-b'],
  );
  assert.equal(parsed.inputs[0].path, '/tmp/first group.jsonl');
  assert.equal(parsed.output, '/tmp/output');
});

test('merge retains source messages and marks exact cross-archive duplicates', async () => {
  const testDirectory = await mkdtemp(join(tmpdir(), 'runips-chat-merge-'));
  const firstPath = join(testDirectory, 'first.jsonl');
  const secondPath = join(testDirectory, 'second.jsonl');
  const outputPath = join(testDirectory, 'output');

  const commonMessage = {
    _type: 'message',
    sender: 'participant-1',
    accountName: 'Student',
    timestamp: 1_700_000_000,
    type: 0,
    content: '  How do I enrol?  ',
    chatRecords: [],
  };

  try {
    await writeFile(
      firstPath,
      jsonLines([
        { _type: 'header', chatlab: 1, meta: {} },
        {
          _type: 'member',
          platformId: 'participant-1',
          accountName: 'Student',
        },
        { ...commonMessage, platformMessageId: 'message-a' },
        {
          ...commonMessage,
          platformMessageId: 'message-b',
          timestamp: 1_700_000_100,
          content: 'A later message',
        },
      ]),
    );
    await writeFile(
      secondPath,
      jsonLines([
        { _type: 'header', chatlab: 1, meta: {} },
        {
          _type: 'member',
          platformId: 'participant-2',
          accountName: 'Helper',
        },
        {
          ...commonMessage,
          platformMessageId: 'message-c',
          content: 'How do I enrol?',
        },
      ]),
    );

    const manifest = await mergeChatlabArchives({
      inputs: [
        { label: 'group-a', path: firstPath },
        { label: 'group-b', path: secondPath },
      ],
      output: outputPath,
    });

    assert.equal(manifest.corpus.message_count, 3);
    assert.equal(manifest.corpus.participant_count, 2);
    assert.equal(manifest.corpus.exact_cross_archive_duplicate_group_count, 1);
    assert.equal(manifest.corpus.exact_cross_archive_duplicate_message_count, 2);

    const messages = (await readFile(join(outputPath, 'messages.jsonl'), 'utf8'))
      .trim()
      .split('\n')
      .map(JSON.parse);
    assert.equal(messages.length, 3);
    assert.equal(messages[0].source_archive, 'group-a');
    assert.equal(messages[1].source_archive, 'group-b');
    assert.equal(
      messages[0].exact_duplicate_group_id,
      messages[1].exact_duplicate_group_id,
    );
    assert.equal(messages[2].exact_duplicate_group_id, null);
  } finally {
    await rm(testDirectory, { recursive: true, force: true });
  }
});
