-- KYV local music audio import · additive private Storage bucket only.
-- No existing tables, rows, function signatures or migrations are changed.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('kyv-local-audio','kyv-local-audio',false,52428800,
 array['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/vnd.wave',
       'audio/aiff','audio/x-aiff','audio/flac','audio/x-flac','audio/mp4','audio/x-m4a',
       'audio/aac','audio/ogg','audio/opus','application/ogg','application/octet-stream'])
on conflict(id) do nothing;
create policy kyv_local_audio_select on storage.objects
  for select to authenticated
  using(bucket_id='kyv-local-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy kyv_local_audio_insert on storage.objects
  for insert to authenticated
  with check(bucket_id='kyv-local-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy kyv_local_audio_delete on storage.objects
  for delete to authenticated
  using(bucket_id='kyv-local-audio' and (storage.foldername(name))[1]=(select auth.uid())::text);
