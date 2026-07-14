-- Category taxonomy (flat, admin-controlled)
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  suggested_by uuid NULL REFERENCES public.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_categories_status ON public.categories(status);

-- Seed approved categories (garments-heavy + cross-industry)
INSERT INTO public.categories (slug, name, status) VALUES
  ('garment-stitching', 'Garment Stitching', 'approved'),
  ('embroidery', 'Embroidery', 'approved'),
  ('fabric-cutting', 'Fabric Cutting', 'approved'),
  ('fabric-dyeing', 'Fabric Dyeing', 'approved'),
  ('fabric-printing', 'Fabric Printing', 'approved'),
  ('knitting', 'Knitting', 'approved'),
  ('lace-trim', 'Lace & Trim', 'approved'),
  ('buttons-zippers', 'Buttons, Zippers & Notions', 'approved'),
  ('labels-tags', 'Labels & Tags', 'approved'),
  ('packaging', 'Packaging', 'approved'),
  ('leather-tanning', 'Leather Tanning', 'approved'),
  ('leather-goods', 'Leather Goods Manufacturing', 'approved'),
  ('footwear', 'Footwear Manufacturing', 'approved'),
  ('jewelry', 'Jewelry & Accessories', 'approved'),
  ('metal-fabrication', 'Metal Fabrication', 'approved'),
  ('sheet-metal', 'Sheet Metal Work', 'approved'),
  ('cnc-machining', 'CNC Machining', 'approved'),
  ('welding', 'Welding', 'approved'),
  ('plastics', 'Plastics & Molding', 'approved'),
  ('woodwork', 'Woodwork & Carpentry', 'approved'),
  ('furniture', 'Furniture Manufacturing', 'approved'),
  ('printing', 'Printing', 'approved'),
  ('signage', 'Signage', 'approved'),
  ('electronics', 'Electronics Assembly', 'approved'),
  ('electrical-parts', 'Electrical Parts', 'approved'),
  ('auto-parts', 'Auto Parts', 'approved'),
  ('ceramics', 'Ceramics', 'approved'),
  ('glass', 'Glass Work', 'approved'),
  ('cosmetics', 'Cosmetics Manufacturing', 'approved'),
  ('food-processing', 'Food Processing', 'approved'),
  ('pending-review', 'Pending Review', 'approved')
ON CONFLICT (slug) DO NOTHING;
