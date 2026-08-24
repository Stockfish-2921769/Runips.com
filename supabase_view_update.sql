-- 排名视图：处理"未定"(NULL) 引用数，NULL 按 0 参与计算但显示为"未定"
-- 权重可后续按数据分布调整
create or replace view public.professor_ranking as
select p.*,
  coalesce(v.vote_count, 0) as vote_count,
  round((
    1.0 * ln(coalesce(nullif(p.scholar_citations, 0), 0) + 1) +
    0.5 * ln(coalesce(nullif(p.search_count, 0), 0) + 1) +
    2.0 * ln(coalesce(nullif(p.click_count, 0), 0) + 1)
  )::numeric, 2) as score
from public.professors p
left join (
  select professor_id, count(*) as vote_count
  from public.votes group by professor_id
) v on v.professor_id = p.id;
