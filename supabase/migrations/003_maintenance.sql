-- Tabla de configuración global de la aplicación
CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT 'false',
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Valor inicial: mantenimiento desactivado
INSERT INTO app_settings (key, value)
VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública (necesario antes del login para bloquear signup)
CREATE POLICY "public read settings"
  ON app_settings FOR SELECT
  USING (true);

-- Solo admin puede actualizar
CREATE POLICY "admin update settings"
  ON app_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
