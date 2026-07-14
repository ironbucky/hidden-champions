-- Private storage bucket for supplier photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-photos', 'supplier-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Allow champions to upload to their own folder: user-id/*.ext
CREATE POLICY storage_supplier_photos_upload_champions
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'supplier-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow anyone to read clean, published photos
CREATE POLICY storage_supplier_photos_read_public
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'supplier-photos'
    AND EXISTS (
      SELECT 1 FROM public.supplier_photos p
      WHERE p.storage_path = name
        AND p.ocr_status = 'clean'
        AND p.published_at IS NOT NULL
    )
  );

-- Allow admins to read any photo (including held)
CREATE POLICY storage_supplier_photos_read_admin
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'supplier-photos'
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Allow admins to delete/replace photos
CREATE POLICY storage_supplier_photos_admin_all
  ON storage.objects FOR ALL TO authenticated
  USING (
    bucket_id = 'supplier-photos'
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'supplier-photos'
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
