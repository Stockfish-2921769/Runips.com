-- A reviewer cannot mark their own review as helpful or unhelpful.

drop policy if exists "users can create their review votes" on public.professor_review_votes;
create policy "users can create their review votes"
on public.professor_review_votes for insert to authenticated
with check (
  user_id = auth.uid()
  and not exists (
    select 1
    from public.professor_reviews review
    where review.id = review_id
      and review.user_id = auth.uid()
  )
);

drop policy if exists "users can update their review votes" on public.professor_review_votes;
create policy "users can update their review votes"
on public.professor_review_votes for update to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and not exists (
    select 1
    from public.professor_reviews review
    where review.id = review_id
      and review.user_id = auth.uid()
  )
);
