-- Six-dimension supervisor ratings become optional.
--
-- Not every reviewer can speak to every dimension. Someone who was never a core
-- lab member has no basis to rate career support, and forcing a number out of
-- them puts a guess into the average that reads exactly like first-hand
-- experience. A null now means "not applicable" and is excluded from every
-- average rather than scored.
--
-- `overall_rating` and `pressure_rating` stay required: they are the two things
-- every reviewer can answer, and the ranking depends on overall being present.

alter table public.professor_reviews
  alter column supervision_rating drop not null,
  alter column communication_rating drop not null,
  alter column autonomy_rating drop not null,
  alter column lab_culture_rating drop not null,
  alter column research_support_rating drop not null,
  alter column career_support_rating drop not null;

-- The existing range checks need no change: `null >= 1 and null <= 5` evaluates
-- to null, and a check constraint only rejects a row when it evaluates to false.
-- Ratings that are present are still confined to 1-5.

-- avg() already skips nulls, so the averages were correct the moment the column
-- became nullable. What was missing is how many people actually rated each
-- dimension — without it, a 5.0 from one reviewer looks identical to a 5.0 from
-- forty, and "based on N reviews" beside it would be plainly wrong.
create or replace view public.professor_review_summaries as
  select
    professor_id,
    count(*)::integer as review_count,
    round(avg(overall_rating), 1) as overall_average,
    round(avg(pressure_rating), 1) as pressure_average,
    round(100.0 * count(*) filter (where would_choose_again)::numeric
          / nullif(count(*), 0)::numeric, 0) as would_choose_again_percent,
    round(avg(supervision_rating), 1) as supervision_average,
    round(avg(communication_rating), 1) as communication_average,
    round(avg(autonomy_rating), 1) as autonomy_average,
    round(avg(lab_culture_rating), 1) as lab_culture_average,
    round(avg(research_support_rating), 1) as research_support_average,
    round(avg(career_support_rating), 1) as career_support_average,
    -- count(col) counts non-nulls, which is exactly the number of reviewers who
    -- rated that dimension rather than marking it not applicable.
    count(supervision_rating)::integer as supervision_count,
    count(communication_rating)::integer as communication_count,
    count(autonomy_rating)::integer as autonomy_count,
    count(lab_culture_rating)::integer as lab_culture_count,
    count(research_support_rating)::integer as research_support_count,
    count(career_support_rating)::integer as career_support_count
  from public.professor_reviews
  where status = 'published'
  group by professor_id;
