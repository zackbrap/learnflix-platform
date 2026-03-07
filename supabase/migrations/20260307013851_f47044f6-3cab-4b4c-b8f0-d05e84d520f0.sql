
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('contents', 'contents', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Authenticated users can upload contents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contents');

CREATE POLICY "Public can read contents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contents');

CREATE POLICY "Teachers can delete own contents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contents');
