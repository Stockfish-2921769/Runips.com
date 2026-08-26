-- Questions and discussions share the same accepted-reply workflow.
-- Guides remain editorial content and cannot have an accepted reply.

do $$
declare
  constraint_record record;
  dropped_constraints integer := 0;
begin
  -- The initial MVP constraint was intentionally unnamed. Resolve it by its
  -- referenced columns so this migration is independent of generated names.
  for constraint_record in
    select constraint_entry.conname
    from pg_catalog.pg_constraint constraint_entry
    where constraint_entry.conrelid = 'public.community_topics'::regclass
      and constraint_entry.contype = 'c'
      and position(
        'accepted_reply_id'
        in pg_catalog.pg_get_constraintdef(constraint_entry.oid)
      ) > 0
      and position(
        'kind'
        in pg_catalog.pg_get_constraintdef(constraint_entry.oid)
      ) > 0
  loop
    execute pg_catalog.format(
      'alter table public.community_topics drop constraint %I',
      constraint_record.conname
    );
    dropped_constraints := dropped_constraints + 1;
  end loop;

  if dropped_constraints = 0 then
    raise exception using
      errcode = 'P0002',
      message = 'Community accepted-reply kind constraint was not found';
  end if;
end;
$$;

alter table public.community_topics
  add constraint community_topics_accepted_reply_kind_check
  check (
    accepted_reply_id is null
    or kind in ('question', 'discussion')
  );

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
    and auth.uid() is not null
    and (
      coalesce(topic.author_user_id = auth.uid(), false)
      or public.viewer_is_community_moderator()
    )
  ) as can_accept_solution,
  public.viewer_is_community_moderator() as can_moderate,
  (
    auth.uid() is not null
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
  topic.last_activity_at
from public.community_topics topic
join public.community_categories category on category.id = topic.category_id
left join public.community_topics duplicate_target on duplicate_target.id = topic.duplicate_of_topic_id
where topic.status <> 'hidden'
   or public.viewer_is_community_moderator();

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

revoke all on public.community_topics_public from public, anon, authenticated;
grant select on public.community_topics_public to anon, authenticated;

revoke all on function public.mark_community_solution(bigint, bigint)
from public, anon, authenticated;
grant execute on function public.mark_community_solution(bigint, bigint)
to authenticated;

comment on constraint community_topics_accepted_reply_kind_check
on public.community_topics is
  'Questions and discussions may accept a reply; guides may not.';

comment on function public.mark_community_solution(bigint, bigint) is
  'Sets or clears the accepted reply on a question or discussion for its author or a Community moderator.';
