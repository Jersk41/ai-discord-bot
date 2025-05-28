-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the audio bucket
CREATE POLICY "Allow public read for audio files"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

CREATE POLICY "Allow service role insert for audio files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'audio'
  AND auth.role() = 'service_role'
);

CREATE POLICY "Allow service role update for audio files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'audio'
  AND auth.role() = 'service_role'
);
create policy "Public Access"  on storage.objects for select  using ( bucket_id = 'public' );