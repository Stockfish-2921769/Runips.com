-- Persistent, Discourse-shaped Community identities.
-- Public profiles deliberately omit auth UUIDs, email addresses and OAuth data.

create sequence public.account_profile_username_seq
  as bigint
  start with 1000
  increment by 1
  no cycle;

create table public.account_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null default (
    'member_' || lpad(nextval('public.account_profile_username_seq')::text, 6, '0')
  ),
  display_name text not null default 'Community member',
  avatar_colour text not null default 'violet',
  waseda_verified boolean not null default false,
  waseda_verified_at timestamptz,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_profiles_username_format_check check (
    username = lower(username)
    and username ~ '^[a-z0-9][a-z0-9_]{2,29}$'
  ),
  constraint account_profiles_display_name_check check (
    char_length(btrim(display_name)) between 1 and 40
    and display_name !~ '[[:cntrl:]]'
  ),
  constraint account_profiles_avatar_colour_check check (
    avatar_colour in ('violet', 'cyan', 'blue', 'emerald', 'amber', 'rose', 'slate', 'indigo')
  ),
  constraint account_profiles_verification_time_check check (
    (waseda_verified and waseda_verified_at is not null)
    or (not waseda_verified and waseda_verified_at is null)
  )
);

create unique index account_profiles_username_lower_key
on public.account_profiles (lower(username));

alter table public.account_profiles enable row level security;

create or replace function public.touch_account_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger account_profiles_touch_updated_at
before update on public.account_profiles
for each row execute function public.touch_account_profile_updated_at();

create or replace function public.create_account_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists runips_create_account_profile on auth.users;
create trigger runips_create_account_profile
after insert on auth.users
for each row execute function public.create_account_profile_for_auth_user();

insert into public.account_profiles (user_id)
select auth_user.id
from auth.users auth_user
on conflict (user_id) do nothing;

create or replace function public.is_waseda_domain(p_domain text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(rtrim(btrim(coalesce(p_domain, '')), '.')) = 'waseda.jp'
    or lower(rtrim(btrim(coalesce(p_domain, '')), '.')) like '%.waseda.jp';
$$;

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
      and public.is_waseda_domain(identity_record.identity_data ->> 'hd')
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

create or replace function public.sync_account_profile_from_auth_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_user_id uuid;
begin
  affected_user_id := case when tg_op = 'DELETE' then old.user_id else new.user_id end;
  perform public.sync_account_waseda_verification(affected_user_id);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists runips_sync_account_profile_from_identity on auth.identities;
create trigger runips_sync_account_profile_from_identity
after insert or update or delete on auth.identities
for each row execute function public.sync_account_profile_from_auth_identity();

do $$
declare
  auth_user_record record;
begin
  for auth_user_record in select id from auth.users loop
    perform public.sync_account_waseda_verification(auth_user_record.id);
  end loop;
end;
$$;

create or replace function public.account_is_permanent(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null
    and exists (
      select 1
      from auth.users auth_user
      where auth_user.id = p_user_id
        and not coalesce(auth_user.is_anonymous, true)
    )
    and exists (
      select 1
      from auth.identities identity_record
      where identity_record.user_id = p_user_id
        and identity_record.provider = 'google'
    );
$$;

create or replace function public.viewer_can_participate_in_community()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.account_is_permanent(auth.uid())
    and exists (
      select 1
      from public.account_profiles profile
      where profile.user_id = auth.uid()
        and profile.profile_completed_at is not null
    );
$$;

create or replace function public.get_my_account_profile()
returns table (
  username text,
  display_name text,
  avatar_colour text,
  waseda_verified boolean,
  profile_completed boolean,
  is_permanent boolean,
  has_google_identity boolean,
  created_at timestamptz
)
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

  insert into public.account_profiles (user_id)
  values (requesting_user)
  on conflict (user_id) do nothing;

  perform public.sync_account_waseda_verification(requesting_user);

  return query
  select
    profile.username,
    profile.display_name,
    profile.avatar_colour,
    profile.waseda_verified,
    profile.profile_completed_at is not null,
    public.account_is_permanent(requesting_user),
    exists (
      select 1
      from auth.identities identity_record
      where identity_record.user_id = requesting_user
        and identity_record.provider = 'google'
    ),
    profile.created_at
  from public.account_profiles profile
  where profile.user_id = requesting_user;
end;
$$;

create or replace function public.update_my_account_profile(
  p_username text,
  p_display_name text,
  p_avatar_colour text
)
returns table (
  username text,
  display_name text,
  avatar_colour text,
  waseda_verified boolean,
  profile_completed boolean,
  is_permanent boolean,
  has_google_identity boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user uuid := auth.uid();
  normalised_username text := lower(btrim(coalesce(p_username, '')));
  normalised_display_name text := btrim(coalesce(p_display_name, ''));
  normalised_avatar_colour text := lower(btrim(coalesce(p_avatar_colour, '')));
begin
  if requesting_user is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not public.account_is_permanent(requesting_user) then
    raise exception using errcode = '42501', message = 'A permanent account is required';
  end if;

  if normalised_username !~ '^[a-z0-9][a-z0-9_]{2,29}$' then
    raise exception using errcode = '22023', message = 'Username must contain 3 to 30 lowercase letters, numbers or underscores';
  end if;

  if normalised_username ~ '^(admin|administrator|moderator|staff|system|support|runips|waseda)(_|[0-9]|$)' then
    raise exception using errcode = '22023', message = 'This username is reserved';
  end if;

  if char_length(normalised_display_name) < 1
    or char_length(normalised_display_name) > 40
    or normalised_display_name ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'Display name must contain 1 to 40 visible characters';
  end if;

  if lower(normalised_display_name) in (
    'admin', 'administrator', 'moderator', 'runips', 'runips team',
    'runips support', 'waseda', 'waseda university', 'waseda official'
  ) then
    raise exception using errcode = '22023', message = 'This display name is reserved';
  end if;

  if normalised_avatar_colour not in (
    'violet', 'cyan', 'blue', 'emerald', 'amber', 'rose', 'slate', 'indigo'
  ) then
    raise exception using errcode = '22023', message = 'Invalid avatar colour';
  end if;

  insert into public.account_profiles (
    user_id,
    username,
    display_name,
    avatar_colour,
    profile_completed_at
  ) values (
    requesting_user,
    normalised_username,
    normalised_display_name,
    normalised_avatar_colour,
    now()
  )
  on conflict (user_id) do update
  set username = excluded.username,
      display_name = excluded.display_name,
      avatar_colour = excluded.avatar_colour,
      profile_completed_at = coalesce(public.account_profiles.profile_completed_at, now());

  perform public.sync_account_waseda_verification(requesting_user);

  return query
  select
    profile.username,
    profile.display_name,
    profile.avatar_colour,
    profile.waseda_verified,
    true,
    true,
    exists (
      select 1
      from auth.identities identity_record
      where identity_record.user_id = requesting_user
        and identity_record.provider = 'google'
    ),
    profile.created_at
  from public.account_profiles profile
  where profile.user_id = requesting_user;
exception
  when unique_violation then
    raise exception using errcode = '23505', message = 'This username is already in use';
end;
$$;

create or replace view public.account_profiles_public
with (security_barrier = true)
as
select
  profile.username,
  profile.display_name,
  profile.avatar_colour,
  case
    when profile.waseda_verified then array['waseda-verified']::text[]
    else '{}'::text[]
  end as badges,
  profile.created_at as joined_at,
  (
    select count(*)::integer
    from public.community_topics topic
    where topic.author_user_id = profile.user_id
      and topic.status not in ('hidden', 'deleted')
  ) as topic_count,
  (
    select count(*)::integer
    from public.community_replies reply
    join public.community_topics topic on topic.id = reply.topic_id
    where reply.author_user_id = profile.user_id
      and reply.status = 'published'
      and topic.status <> 'hidden'
  ) as reply_count
from public.account_profiles profile
join auth.users auth_user on auth_user.id = profile.user_id
where profile.profile_completed_at is not null
  and not coalesce(auth_user.is_anonymous, true);

create or replace function public.enforce_registered_community_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_type = 'user'
    and (
      not public.account_is_permanent(new.author_user_id)
      or not exists (
        select 1
        from public.account_profiles profile
        where profile.user_id = new.author_user_id
          and profile.profile_completed_at is not null
      )
    ) then
    raise exception using
      errcode = '42501',
      message = 'A permanent account and completed public profile are required';
  end if;
  return new;
end;
$$;

create trigger community_topics_require_registered_author
before insert on public.community_topics
for each row execute function public.enforce_registered_community_author();

create trigger community_replies_require_registered_author
before insert on public.community_replies
for each row execute function public.enforce_registered_community_author();

create or replace function public.enforce_permanent_community_reporter()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.account_is_permanent(new.reporter_user_id) then
    raise exception using errcode = '42501', message = 'A permanent account is required';
  end if;
  return new;
end;
$$;

create trigger community_reports_require_permanent_account
before insert on public.community_reports
for each row execute function public.enforce_permanent_community_reporter();

create or replace function public.enforce_permanent_community_subscriber()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.account_is_permanent(new.user_id) then
    raise exception using errcode = '42501', message = 'A permanent account is required';
  end if;
  return new;
end;
$$;

create trigger community_subscriptions_require_permanent_account
before insert on public.community_subscriptions
for each row execute function public.enforce_permanent_community_subscriber();

create or replace view public.community_topics_public
with (security_barrier = true)
as
select
  topic.id,
  topic.kind,
  topic.title,
  topic.body,
  category.slug as category_slug,
  category.name_en as category_name_en,
  category.name_zh as category_name_zh,
  topic.status,
  (
    select count(*)::integer
    from public.community_replies reply_count_source
    where reply_count_source.topic_id = topic.id
      and reply_count_source.status in ('published', 'deleted')
  ) as reply_count,
  topic.accepted_reply_id,
  topic.duplicate_of_topic_id,
  case
    when duplicate_target.status = 'hidden' then null
    else duplicate_target.title
  end as duplicate_of_title,
  topic.source_type,
  case
    when author_profile.profile_completed_at is not null then author_profile.display_name
    when topic.author_user_id = auth.uid() then 'You'
    when topic.author_user_id is null and topic.source_type = 'wechat_archive' then 'RunIPS Community Archive'
    when topic.author_user_id is null and topic.source_type = 'staff' then 'RunIPS team'
    when topic.author_user_id is null then 'Deleted member'
    else 'Community member'
  end as author_label,
  coalesce(topic.author_user_id = auth.uid(), false) as is_mine,
  (
    topic.kind in ('question', 'discussion')
    and topic.status in ('open', 'resolved')
    and (
      public.viewer_is_community_moderator()
      or (
        public.viewer_can_participate_in_community()
        and coalesce(topic.author_user_id = auth.uid(), false)
      )
    )
  ) as can_accept_solution,
  public.viewer_is_community_moderator() as can_moderate,
  (
    public.viewer_can_participate_in_community()
    and topic.status in ('open', 'resolved')
  ) as can_reply,
  (
    auth.uid() is not null
    and exists (
      select 1
      from public.community_subscriptions subscription
      where subscription.topic_id = topic.id
        and subscription.user_id = auth.uid()
    )
  ) as is_subscribed,
  coalesce(
    array(
      select tag.slug
      from public.community_topic_tags topic_tag
      join public.community_tags tag on tag.id = topic_tag.tag_id
      where topic_tag.topic_id = topic.id
      order by tag.slug
    ),
    '{}'::text[]
  ) as tags,
  topic.created_at,
  topic.updated_at,
  topic.last_activity_at,
  case when author_profile.profile_completed_at is not null then author_profile.username end
    as author_username,
  case when author_profile.profile_completed_at is not null then author_profile.display_name end
    as author_display_name,
  case when author_profile.profile_completed_at is not null then author_profile.avatar_colour end
    as author_avatar_colour,
  case
    when author_profile.profile_completed_at is not null and author_profile.waseda_verified
      then array['waseda-verified']::text[]
    else '{}'::text[]
  end as author_badges
from public.community_topics topic
join public.community_categories category on category.id = topic.category_id
left join public.community_topics duplicate_target on duplicate_target.id = topic.duplicate_of_topic_id
left join public.account_profiles author_profile on author_profile.user_id = topic.author_user_id
where topic.status <> 'hidden'
   or public.viewer_is_community_moderator();

create or replace view public.community_replies_public
with (security_barrier = true)
as
select
  reply.id,
  reply.topic_id,
  reply.body,
  reply.quote_reply_id,
  reply.status,
  reply.source_type,
  case
    when author_profile.profile_completed_at is not null then author_profile.display_name
    when reply.author_user_id = auth.uid() then 'You'
    when reply.author_user_id is null and reply.source_type = 'wechat_archive' then 'RunIPS Community Archive'
    when reply.author_user_id is null and reply.source_type = 'staff' then 'RunIPS team'
    when reply.author_user_id is null then 'Deleted member'
    else 'Community member'
  end as author_label,
  coalesce(reply.author_user_id = auth.uid(), false) as is_mine,
  coalesce(reply.author_user_id = topic.author_user_id, false) as is_topic_author,
  coalesce(topic.accepted_reply_id = reply.id, false) as is_accepted,
  public.viewer_is_community_moderator() as can_moderate,
  reply.created_at,
  reply.updated_at,
  case when author_profile.profile_completed_at is not null then author_profile.username end
    as author_username,
  case when author_profile.profile_completed_at is not null then author_profile.display_name end
    as author_display_name,
  case when author_profile.profile_completed_at is not null then author_profile.avatar_colour end
    as author_avatar_colour,
  case
    when author_profile.profile_completed_at is not null and author_profile.waseda_verified
      then array['waseda-verified']::text[]
    else '{}'::text[]
  end as author_badges
from public.community_replies reply
join public.community_topics topic on topic.id = reply.topic_id
left join public.account_profiles author_profile on author_profile.user_id = reply.author_user_id
where (topic.status <> 'hidden' or public.viewer_is_community_moderator())
  and (reply.status <> 'hidden' or public.viewer_is_community_moderator());

create or replace function public.mark_community_solution(
  p_topic_id bigint,
  p_reply_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user uuid := auth.uid();
  topic_author uuid;
  topic_kind text;
  topic_status text;
  reply_author uuid;
begin
  if requesting_user is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not public.viewer_is_community_moderator()
    and not public.viewer_can_participate_in_community() then
    raise exception using
      errcode = '42501',
      message = 'A permanent Google account and completed public profile are required';
  end if;

  select topic.author_user_id, topic.kind, topic.status
  into topic_author, topic_kind, topic_status
  from public.community_topics topic
  where topic.id = p_topic_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Community topic was not found';
  end if;

  if requesting_user is distinct from topic_author
    and not public.viewer_is_community_moderator() then
    raise exception using errcode = '42501', message = 'Only the topic author or a moderator can choose a solution';
  end if;

  if topic_kind not in ('question', 'discussion')
    or topic_status not in ('open', 'resolved') then
    raise exception using errcode = '22023', message = 'This topic cannot accept a solution';
  end if;

  if p_reply_id is null then
    update public.community_topics
    set accepted_reply_id = null,
        status = 'open',
        last_activity_at = now()
    where id = p_topic_id;

    return null;
  end if;

  select reply.author_user_id
  into reply_author
  from public.community_replies reply
  where reply.id = p_reply_id
    and reply.topic_id = p_topic_id
    and reply.status = 'published';

  if not found then
    raise exception using errcode = '22023', message = 'Solution must be a published reply on this topic';
  end if;

  update public.community_topics
  set accepted_reply_id = p_reply_id,
      status = 'resolved',
      last_activity_at = now()
  where id = p_topic_id;

  if reply_author is not null and reply_author <> requesting_user then
    insert into public.community_notifications (
      recipient_user_id,
      actor_user_id,
      event_type,
      topic_id,
      reply_id
    ) values (
      reply_author,
      requesting_user,
      'solution',
      p_topic_id,
      p_reply_id
    );
  end if;

  return p_reply_id;
end;
$$;

revoke all on public.account_profiles from public, anon, authenticated;
revoke all on sequence public.account_profile_username_seq from public, anon, authenticated;

revoke all on public.account_profiles_public from public, anon, authenticated;
grant select on public.account_profiles_public to anon, authenticated;

revoke all on public.community_topics_public from public, anon, authenticated;
grant select on public.community_topics_public to anon, authenticated;

revoke all on public.community_replies_public from public, anon, authenticated;
grant select on public.community_replies_public to anon, authenticated;

revoke all on function public.touch_account_profile_updated_at() from public, anon, authenticated;
revoke all on function public.create_account_profile_for_auth_user() from public, anon, authenticated;
revoke all on function public.is_waseda_domain(text) from public, anon, authenticated;
revoke all on function public.sync_account_waseda_verification(uuid) from public, anon, authenticated;
revoke all on function public.sync_account_profile_from_auth_identity() from public, anon, authenticated;
revoke all on function public.account_is_permanent(uuid) from public, anon, authenticated;
revoke all on function public.enforce_registered_community_author() from public, anon, authenticated;
revoke all on function public.enforce_permanent_community_reporter() from public, anon, authenticated;
revoke all on function public.enforce_permanent_community_subscriber() from public, anon, authenticated;

revoke all on function public.viewer_can_participate_in_community() from public, anon, authenticated;
grant execute on function public.viewer_can_participate_in_community() to anon, authenticated;

revoke all on function public.get_my_account_profile() from public, anon, authenticated;
grant execute on function public.get_my_account_profile() to authenticated;

revoke all on function public.update_my_account_profile(text, text, text) from public, anon, authenticated;
grant execute on function public.update_my_account_profile(text, text, text) to authenticated;

revoke all on function public.mark_community_solution(bigint, bigint) from public, anon, authenticated;
grant execute on function public.mark_community_solution(bigint, bigint) to authenticated;

comment on table public.account_profiles is
  'Private account-to-public-profile mapping. Direct access is denied; public views never expose user_id.';

comment on column public.account_profiles.waseda_verified is
  'True only when a Google identity has a verified Waseda-domain email and matching Google Workspace hosted-domain claim. It does not establish current student or IPS status.';

comment on view public.account_profiles_public is
  'Public Discourse-shaped identity fields and contribution counts; no email, OAuth claim or auth UUID.';
