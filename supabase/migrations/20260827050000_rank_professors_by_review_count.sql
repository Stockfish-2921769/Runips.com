-- Rank supervisors by how many reviews they have.
--
-- Clicks were the previous key, but `increment_clicks` is firing for a tiny
-- fraction of real visits: on 2026-08-27 the service took 30 review submissions
-- — each of which requires a person sitting on a supervisor page — while the
-- counter moved twice. Until that is diagnosed, `click_count` is not a number
-- worth ordering by.
--
-- Review count is data the service already records correctly, and it ranks by
-- the thing the site exists for: which supervisors students have actually
-- written about. Ties keep their existing `id` tiebreak, so the order is stable
-- across page loads rather than shuffling.

create or replace view public.professor_ranking as
  select
    p.id,
    p.name,
    p.lab,
    p.division,
    p.scholar_citations,
    p.search_count,
    p.click_count,
    p.citations_updated_at,
    p.created_at,
    coalesce(r.review_count, 0::bigint)::integer as vote_count,
    coalesce(r.review_count, 0::bigint)::numeric as score
  from public.professors p
  left join (
    select professor_id, count(*) as review_count
    from public.professor_reviews
    where status = 'published'
    group by professor_id
  ) r on r.professor_id = p.id;
