-- Supplier photos with OCR review status
CREATE TABLE IF NOT EXISTS public.supplier_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  geopoint geography(point, 4326) NULL,
  exif_taken_at timestamptz NULL,
  ocr_status text NOT NULL DEFAULT 'held' CHECK (ocr_status IN ('clean', 'held', 'reviewed', 'rejected')),
  ocr_detected_phone text NULL,
  published_at timestamptz NULL,
  reviewed_by uuid NULL REFERENCES public.users(id),
  reviewed_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_photos_supplier ON public.supplier_photos(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_photos_status ON public.supplier_photos(ocr_status);
CREATE INDEX IF NOT EXISTS idx_supplier_photos_published ON public.supplier_photos(published_at);
