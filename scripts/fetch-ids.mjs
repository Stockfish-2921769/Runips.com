import { writeFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ljfxmibftwelkskjzmly.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!anonKey) {
  console.error('缺少 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const res = await fetch(`${supabaseUrl}/rest/v1/professors?select=id&order=id`, {
  headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
});

if (!res.ok) {
  console.error('获取教授列表失败:', res.status, await res.text());
  process.exit(1);
}

const rows = await res.json();

if (rows.length === 0) {
  console.error('professors 表为空，请先在 Supabase SQL Editor 运行 supabase_seed.sql');
  process.exit(1);
}

const ids = rows.map((r) => r.id);const content = `export const PROFESSOR_IDS: number[] = [${ids.join(', ')}];

export const getProfessorParams = () => PROFESSOR_IDS.map((id) => ({ id: String(id) }));
`;

writeFileSync('src/data/professorIds.ts', content);
console.log(`已写入 ${ids.length} 个教授 ID 到 src/data/professorIds.ts`);
