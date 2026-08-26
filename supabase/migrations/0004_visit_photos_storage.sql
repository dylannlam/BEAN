-- Storage bucket for photos attached to a visit/review. Public read, writes
-- restricted to a user's own folder (path convention: visit-photos/{user_id}/{filename}),
-- same pattern as the avatars bucket in 0002_avatar_storage.sql.

insert into storage.buckets (id, name, public)
values ('visit-photos', 'visit-photos', true)
on conflict (id) do nothing;

create policy "Visit photos are publicly accessible" on storage.objects
  for select using (bucket_id = 'visit-photos');

create policy "Users can upload their own visit photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own visit photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'visit-photos' and (storage.foldername(name))[1] = auth.uid()::text);
