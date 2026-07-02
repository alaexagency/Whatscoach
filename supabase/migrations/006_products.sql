-- =============================================
-- PRODUCTS: biblioteca de productos por empresa
-- =============================================
CREATE TABLE public.products (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_by         uuid NOT NULL REFERENCES auth.users(id),
  name               text NOT NULL,
  what_we_sell       text NOT NULL DEFAULT '',
  ideal_client       text NOT NULL DEFAULT '',
  problem_solved     text NOT NULL DEFAULT '',
  value_proposition  text NOT NULL DEFAULT '',
  price              text NOT NULL DEFAULT '',
  main_benefits      text[] NOT NULL DEFAULT '{}',
  common_objections  text[] NOT NULL DEFAULT '{}',
  source_pdf_name    text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_company_id_idx ON public.products(company_id);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Company y admin que creó: gestión completa
CREATE POLICY "products: company manage"
  ON public.products FOR ALL
  USING (company_id = auth.uid() OR created_by = auth.uid());

-- Vendedores: solo lectura de los productos de su empresa
CREATE POLICY "products: vendor read"
  ON public.products FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );
