import { PROFESSOR_SEED } from '../src/data/professors.ts';
import { writeFileSync } from 'fs';

const lines = PROFESSOR_SEED.map((p) => {
  const lab = p.lab ? `'${p.lab.replace(/'/g, "''")}'` : 'NULL';
  return `  ('${p.name.replace(/'/g, "''")}', ${lab}, '${p.division}')`;
}).join(',\n');

const sql = `-- 教授种子数据 (31人)
insert into public.professors (name, lab, division) values
${lines}
on conflict do nothing;

-- 六边形评分平均值视图（绑定投票）
create or replace view public.professor_ratings_avg as
select
  professor_id,
  round(avg(opt_1)::numeric, 1) as opt_1_avg,
  round(avg(opt_2)::numeric, 1) as opt_2_avg,
  round(avg(opt_3)::numeric, 1) as opt_3_avg,
  round(avg(opt_4)::numeric, 1) as opt_4_avg,
  round(avg(opt_5)::numeric, 1) as opt_5_avg,
  round(avg(opt_6)::numeric, 1) as opt_6_avg,
  count(*) as vote_count
from public.votes
group by professor_id;
`;

writeFileSync('supabase_seed.sql', sql);
console.log('generated supabase_seed.sql');
