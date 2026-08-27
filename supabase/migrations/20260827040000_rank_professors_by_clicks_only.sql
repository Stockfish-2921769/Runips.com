-- Rank supervisors by click count alone.
--
-- The score was 1.0*ln(citations) + 0.5*ln(searches) + 2.0*ln(clicks). With
-- almost no traffic yet, the citation term decided the entire order, so the
-- front page was ranking supervisors by how much their field publishes rather
-- than by what students here are actually looking at. Citation counts also say
-- nothing about supervision, which is what this site is for.
--
-- Clicks are kept raw rather than logged: the list is ordered, never scored on
-- screen, so a compressive transform buys nothing and only obscures what the
-- number means. `scholar_citations` stays in the view because the directory
-- still displays it as a column; it simply no longer decides position.

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
    p.click_count::numeric as score
  from public.professors p
  left join (
    select professor_id, count(*) as review_count
    from public.professor_reviews
    where status = 'published'
    group by professor_id
  ) r on r.professor_id = p.id;
