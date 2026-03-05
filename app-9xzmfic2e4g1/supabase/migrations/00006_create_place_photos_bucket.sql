-- Create storage bucket for place photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'place-photos',
  'place-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for place photos" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload place photos" ON storage.objects;

-- Create policy to allow public read access
CREATE POLICY "Public read access for place photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'place-photos');

-- Create policy to allow service role to upload
CREATE POLICY "Service role can upload place photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'place-photos');