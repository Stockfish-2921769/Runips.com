-- Popularity ranking backed by the fresh RunIPS tables.

create or replace view public.professor_ranking
with (security_barrier = true)
as
select
  p.*,
  coalesce(r.review_count, 0)::integer as vote_count,
  round((
    1.0 * ln(coalesce(nullif(p.scholar_citations, 0), 0) + 1) +
    0.5 * ln(coalesce(nullif(p.search_count, 0), 0) + 1) +
    2.0 * ln(coalesce(nullif(p.click_count, 0), 0) + 1)
  )::numeric, 2) as score
from public.professors p
left join (
  select professor_id, count(*) as review_count
  from public.professor_reviews
  where status = 'published'
  group by professor_id
) r on r.professor_id = p.id;

grant select on public.professor_ranking to anon, authenticated;
