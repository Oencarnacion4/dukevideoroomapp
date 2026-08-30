-- Storage bucket for how-to screenshots and screen recordings.
-- Public read (crew-internal content, simplest for <img>/<video> src),
-- authenticated-only write.

insert into storage.buckets (id, name, public)
values ('guide-media', 'guide-media', true)
on conflict (id) do nothing;

create policy guide_media_public_read on storage.objects
  for select using (bucket_id = 'guide-media');

create policy guide_media_authenticated_write on storage.objects
  for insert to authenticated with check (bucket_id = 'guide-media');

create policy guide_media_authenticated_update on storage.objects
  for update to authenticated using (bucket_id = 'guide-media');

create policy guide_media_authenticated_delete on storage.objects
  for delete to authenticated using (bucket_id = 'guide-media');
