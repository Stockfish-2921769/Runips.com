#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

// OpenAlex provides the maintainable numeric feed. The public site links every
// value to a live Google Scholar author search so users can cross-check the
// broader Scholar index without RunIPS automating Scholar search pages.
const AUTHORS = [
  [1, 'A5015913121'],
  [2, 'A5100326923'],
  [3, 'A5047052126'],
  [4, 'A5066452160'],
  [5, 'A5080695008'],
  [6, 'A5060121645'],
  [7, 'A5005634226'],
  [8, 'A5057487414'],
  [9, 'A5004673608'],
  [10, 'A5005421825'],
  [12, 'A5007690546'],
  [13, 'A5033923183'],
  [14, 'A5082894357'],
  [15, 'A5112638971'],
  [16, 'A5003914299'],
  [18, 'A5056128134'],
  [19, 'A5001203533'],
  [20, 'A5033606654'],
  [22, 'A5048399196'],
  [23, 'A5103206427'],
  [25, 'A5103496033'],
  [26, 'A5075702573'],
  [27, 'A5112243909'],
  [28, 'A5066755966'],
  [30, 'A5043324722'],
  [31, 'A5039260364'],
];

// These records have no sufficiently reliable OpenAlex identity match. Keep
// them unknown instead of displaying a citation count from a split or
// homonymous author record.
const UNMAPPED_PROFESSOR_IDS = [11, 17, 24, 29, 32];

const databaseContainer = process.env.RUNIPS_DATABASE_CONTAINER || 'supabase-db';
const collectedAt = new Date().toISOString();
const updates = [];

for (const [professorId, openAlexId] of AUTHORS) {
  const response = await fetch(`https://api.openalex.org/authors/${openAlexId}`, {
    headers: { 'User-Agent': 'RunIPS citation updater (non-commercial student guide)' },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    console.error(`OpenAlex ${openAlexId}: HTTP ${response.status}`);
    continue;
  }

  const author = await response.json();
  const citationCount = Number(author.cited_by_count);
  if (!Number.isSafeInteger(citationCount) || citationCount < 0) {
    console.error(`OpenAlex ${openAlexId}: invalid citation count`);
    continue;
  }

  updates.push({ professorId, citationCount });
}

if (updates.length === 0) {
  throw new Error('No valid citation updates were collected');
}

const statements = updates.map(({ professorId, citationCount }) => (
  `update public.professors set scholar_citations = ${citationCount}, citations_updated_at = '${collectedAt}'::timestamptz where id = ${professorId};`
));
statements.push(
  `update public.professors set scholar_citations = null, citations_updated_at = null where id in (${UNMAPPED_PROFESSOR_IDS.join(', ')});`,
);
const sql = ['begin;', ...statements, 'commit;', "notify pgrst, 'reload schema';", ''].join('\n');

const result = spawnSync(
  'docker',
  ['exec', '-i', databaseContainer, 'psql', '-v', 'ON_ERROR_STOP=1', '-U', 'postgres', '-d', 'postgres'],
  { input: sql, encoding: 'utf8' },
);

if (result.status !== 0) {
  throw new Error(result.stderr || `psql exited with status ${result.status}`);
}

console.log(`Updated ${updates.length} citation counts at ${collectedAt}`);
