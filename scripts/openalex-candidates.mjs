import { PROFESSOR_EN } from '../src/data/professorNames.ts';
import { PROFESSOR_SEED } from '../src/data/professors.ts';

const WASEDA_ID = 'I150744194';

async function queryOpenAlex(name) {
  const url = `https://api.openalex.org/authors?search=${encodeURIComponent(name)}&filter=affiliations.institution.id:${WASEDA_ID}&per-page=6`;
  const res = await fetch(url, { headers: { 'User-Agent': 'runips-cron (research project)' } });
  if (!res.ok) {
    console.error(`查询失败 ${name}: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data.results || []).map((a) => ({
    id: a.id,
    name: a.display_name,
    cited: a.cited_by_count,
    works: a.works_count,
    topics: (a.topics || []).slice(0, 3).map((t) => t.display_name),
    affiliation: (a.affiliations || []).map((x) => x.institution?.display_name).filter(Boolean).join('; '),
  }));
}

async function main() {
  console.log('=== RunIPS 31 位教授 OpenAlex 候选清单 ===\n');
  const rows = [];
  let idx = 0;
  for (const p of PROFESSOR_SEED) {
    idx += 1;
    const en = PROFESSOR_EN[idx];
    const nameEn = en?.nameEn;
    const candidates = nameEn ? await queryOpenAlex(nameEn) : [];
    rows.push({ name: p.name, nameEn, candidates });
    await new Promise((r) => setTimeout(r, 300));
  }

  for (const row of rows) {
    console.log(`\n【${row.name}】 (${row.nameEn})`);
    if (row.candidates.length === 0) {
      console.log('  (无候选，需人工或放宽条件)');
    } else {
      row.candidates.forEach((c, i) => {
        console.log(`  [${i + 1}] ${c.name} | ID: ${c.id.split('/').pop()} | 引用: ${c.cited} | 论文: ${c.works} | 方向: ${c.topics.join(', ')}`);
      });
    }
  }
  console.log('\n=== 完成 ===');
}

main().catch((e) => {
  console.error('脚本失败:', e);
  process.exit(1);
});
