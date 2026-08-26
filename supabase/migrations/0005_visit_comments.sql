create table visit_comments (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid not null references visits (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);
create index visit_comments_visit_id_idx on visit_comments (visit_id);

alter table visit_comments enable row level security;

create policy "Comments are readable by anyone" on visit_comments for select using (true);
create policy "Users add comments as themselves" on visit_comments
  for insert to authenticated with check (auth.uid() = user_id);
create policy "Users delete their own comments" on visit_comments
  for delete using (auth.uid() = user_id);
