-- Renombrar rol 'manager' a 'company' en el ENUM
ALTER TYPE public.user_role RENAME VALUE 'manager' TO 'company';

-- Renombrar columna en profiles
ALTER TABLE public.profiles
  RENAME COLUMN manager_id TO company_id;

-- Renombrar columna en sessions
ALTER TABLE public.sessions
  RENAME COLUMN manager_id TO company_id;

-- Renombrar índice
ALTER INDEX IF EXISTS profiles_manager_id_idx RENAME TO profiles_company_id_idx;
