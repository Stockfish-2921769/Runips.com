-- Remove the written-comment minimum and provide authenticated users with a
-- single-transaction account erasure path.

alter table public.professor_reviews
  drop constraint if exists professor_reviews_comment_check;

alter table public.professor_reviews
  add constraint professor_reviews_comment_check check (
    char_length(comment) <= 2000
  );

comment on column public.professor_reviews.comment is
  'Optional written review. Empty text and comments up to 2000 characters are allowed.';

create or replace function public.delete_my_account(p_confirmation text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user uuid := auth.uid();
begin
  if requesting_user is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if p_confirmation is distinct from 'DELETE MY ACCOUNT' then
    raise exception using errcode = '22023', message = 'Confirmation text does not match';
  end if;

  -- Feedback intentionally uses ON DELETE SET NULL so ordinary moderation can
  -- retain unrelated reports. An account-erasure request is different: remove
  -- every submission that is still linked to this user before deleting auth.
  delete from public.feedback_submissions
  where user_id = requesting_user;

  -- Supabase auth audit entries do not have a foreign key to auth.users.
  delete from auth.audit_log_entries
  where payload ->> 'actor_id' = requesting_user::text;

  -- Auth identities, sessions, reviews, review votes, and review reports all
  -- reference auth.users with ON DELETE CASCADE.
  delete from auth.users
  where id = requesting_user;

  if not found then
    raise exception using errcode = 'P0002', message = 'Account was not found';
  end if;
end;
$$;

revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;

comment on function public.delete_my_account(text) is
  'Permanently deletes the authenticated account and all live data linked to it.';
