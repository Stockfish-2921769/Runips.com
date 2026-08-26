-- Privacy-first review context and optional written comments.
-- NULL context values mean the reviewer chose not to disclose that information.

alter table public.professor_reviews
  alter column student_level drop not null,
  alter column relationship_status drop not null,
  alter column communication_language drop not null;

alter table public.professor_reviews
  drop constraint if exists professor_reviews_comment_check;

alter table public.professor_reviews
  add constraint professor_reviews_comment_check check (
    char_length(comment) <= 2000
    and (
      char_length(btrim(comment)) = 0
      or char_length(btrim(comment)) >= 30
    )
  );

comment on column public.professor_reviews.student_level is
  'Optional context. NULL means the reviewer chose not to disclose it.';
comment on column public.professor_reviews.relationship_status is
  'Optional context. NULL means the reviewer chose not to disclose it.';
comment on column public.professor_reviews.communication_language is
  'Optional context. NULL means the reviewer chose not to disclose it.';
comment on column public.professor_reviews.comment is
  'Optional written review. Empty is allowed; non-empty text must be 30 to 2000 characters.';
