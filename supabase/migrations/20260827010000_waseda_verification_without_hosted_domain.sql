-- Waseda verification: accept any verified waseda.jp address.
--
-- The original check also required Google's `hd` (hosted domain) claim to be a
-- Waseda domain. Google only sends `hd` for accounts a Google Workspace
-- organisation manages, and it is absent for @fuji.waseda.jp sign-ins, so the
-- condition excluded the campus addresses the badge exists to recognise — no
-- account could ever qualify.
--
-- What each signal proves:
--   `hd`                        the account is currently administered by the
--                               organisation, so it stops working when the
--                               organisation disables it
--   `email_verified` + domain   Google confirmed the person controlled that
--                               mailbox
--
-- Dropping `hd` therefore widens who qualifies and keeps the badge accurate for
-- someone whose campus mailbox is later closed, because a personal Google
-- account keeps the verified address. The badge continues to claim only what it
-- says — that a Waseda address was verified — not current enrolment or
-- employment. Every other condition is unchanged: the identity must be Google,
-- non-anonymous, email-confirmed, and its address must match the account's.

create or replace function public.sync_account_waseda_verification(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  verified boolean := false;
begin
  if p_user_id is null or not exists (
    select 1
    from auth.users auth_user
    where auth_user.id = p_user_id
  ) then
    return false;
  end if;

  insert into public.account_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select exists (
    select 1
    from auth.identities identity_record
    join auth.users auth_user on auth_user.id = identity_record.user_id
    where identity_record.user_id = p_user_id
      and identity_record.provider = 'google'
      and not coalesce(auth_user.is_anonymous, true)
      and auth_user.email_confirmed_at is not null
      and lower(coalesce(identity_record.identity_data ->> 'email_verified', 'false')) = 'true'
      and lower(coalesce(identity_record.identity_data ->> 'email', '')) = lower(coalesce(auth_user.email, ''))
      and public.is_waseda_domain(
        split_part(lower(coalesce(identity_record.identity_data ->> 'email', '')), '@', 2)
      )
  ) into verified;

  update public.account_profiles profile
  set waseda_verified = verified,
      waseda_verified_at = case
        when verified then coalesce(profile.waseda_verified_at, now())
        else null
      end
  where profile.user_id = p_user_id;

  return verified;
end;
$$;

-- Re-evaluate every existing account against the relaxed rule.
do $$
declare
  auth_user_record record;
begin
  for auth_user_record in select id from auth.users loop
    perform public.sync_account_waseda_verification(auth_user_record.id);
  end loop;
end;
$$;
