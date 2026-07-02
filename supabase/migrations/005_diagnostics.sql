-- =============================================
-- DIAGNOSTICS: análisis de chats reales subidos
-- =============================================
CREATE TABLE public.diagnostics (
  id              uuid primary key default gen_random_uuid(),
  uploaded_by     uuid not null references auth.users(id) on delete cascade,
  company_id      uuid references public.profiles(id) on delete set null,
  vendor_id       uuid references public.profiles(id) on delete set null,
  product_name    text not null default '',
  product_price   text not null default '',
  vendor_name_raw text not null default '',
  parsed_messages jsonb not null default '[]',
  -- Resultados de evaluación Gemini
  score_conversation  int,
  score_objections    int,
  score_closing       int,
  score_final         int,
  strengths           text[],
  improvements        text[],
  techniques_applied  text[],
  techniques_missing  text[],
  recommended_close   text,
  ideal_response      text,
  created_at      timestamptz not null default now()
);

CREATE INDEX diagnostics_uploaded_by_idx ON public.diagnostics(uploaded_by);
CREATE INDEX diagnostics_company_id_idx  ON public.diagnostics(company_id);
CREATE INDEX diagnostics_vendor_id_idx   ON public.diagnostics(vendor_id);
CREATE INDEX diagnostics_created_at_idx  ON public.diagnostics(created_at DESC);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Acceso: el que subió, la empresa dueña, o el vendedor al que pertenece
CREATE POLICY "diagnostics: access"
  ON public.diagnostics FOR ALL
  USING (
    auth.uid() = uploaded_by
    OR auth.uid() = company_id
    OR auth.uid() = vendor_id
  );
