-- Bean initial schema — mirrors src/data/types.ts.
--
-- Tags and badges are NOT tables here: both are static taxonomies defined
-- client-side (src/lib/tags.ts, src/data/mock/badges.ts) and referenced only
-- by their string id, so cafe_tags/visit_tags just store tag ids directly
-- with no foreign key into a tags table.

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  joined_at timestamptz not null default now()
);

create table cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  neighborhood text not null,
  lat double precision not null,
  lng double precision not null,
  price_level smallint not null check (price_level between 1 and 3),
  photo_url text,
  description text,
  close_hour smallint not null default 19,
  google_place_id text unique,
  created_at timestamptz not null default now()
);
create index cafes_lat_lng_idx on cafes (lat, lng);

create table cafe_tags (
  cafe_id uuid references cafes (id) on delete cascade,
  tag_id text not null,
  primary key (cafe_id, tag_id)
);

create table visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  cafe_id uuid not null references cafes (id) on delete cascade,
  rating text not null check (rating in ('good', 'fine', 'bad')),
  score real not null default 0,
  note text not null default '',
  photo_urls text[] not null default '{}',
  status text not null check (status in ('been', 'want')),
  created_at timestamptz not null default now()
);
create index visits_user_id_idx on visits (user_id);
create index visits_cafe_id_idx on visits (cafe_id);

create table visit_tags (
  visit_id uuid references visits (id) on delete cascade,
  tag_id text not null,
  primary key (visit_id, tag_id)
);

create table visit_likes (
  visit_id uuid references visits (id) on delete cascade,
  user_id uuid references profiles (id) on delete cascade,
  primary key (visit_id, user_id)
);

create table follows (
  follower_id uuid references profiles (id) on delete cascade,
  following_id uuid references profiles (id) on delete cascade,
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Auto-create a profile row whenever someone signs up, from the
-- username/display_name passed as auth signUp options.data.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table cafes enable row level security;
alter table cafe_tags enable row level security;
alter table visits enable row level security;
alter table visit_tags enable row level security;
alter table visit_likes enable row level security;
alter table follows enable row level security;

create policy "Profiles are readable by anyone" on profiles for select using (true);
create policy "Users manage their own profile" on profiles for update using (auth.uid() = id);

create policy "Cafes are readable by anyone" on cafes for select using (true);
create policy "Authenticated users can add cafes" on cafes for insert to authenticated with check (true);

create policy "Cafe tags are readable by anyone" on cafe_tags for select using (true);
create policy "Authenticated users can tag cafes" on cafe_tags for insert to authenticated with check (true);

create policy "Visits are readable by anyone" on visits for select using (true);
create policy "Users manage their own visits" on visits for insert with check (auth.uid() = user_id);
create policy "Users update their own visits" on visits for update using (auth.uid() = user_id);
create policy "Users delete their own visits" on visits for delete using (auth.uid() = user_id);

create policy "Visit tags are readable by anyone" on visit_tags for select using (true);
create policy "Users tag their own visits" on visit_tags for insert with check (
  exists (select 1 from visits where visits.id = visit_tags.visit_id and visits.user_id = auth.uid())
);
create policy "Users remove their own visit tags" on visit_tags for delete using (
  exists (select 1 from visits where visits.id = visit_tags.visit_id and visits.user_id = auth.uid())
);

create policy "Likes are readable by anyone" on visit_likes for select using (true);
create policy "Users manage their own likes" on visit_likes for all using (auth.uid() = user_id);

create policy "Follows are readable by anyone" on follows for select using (true);
create policy "Users manage their own follows" on follows for all using (auth.uid() = follower_id);
