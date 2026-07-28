-- ====================================================================
-- ESQUEMA SQL PARA SUPABASE - GESTIÓN DE FINANZAS PERSONALES
-- Incluye Tablas, Claves Foráneas, Índices y Row Level Security (RLS)
-- ====================================================================

-- 1. TABLA: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden ver su propio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden actualizar su propio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios pueden insertar su propio perfil" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 2. TABLA: categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  color TEXT NOT NULL DEFAULT '#3b82f6',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver categorias globales o creadas por ellos" ON public.categories;
CREATE POLICY "Usuarios pueden ver categorias globales o creadas por ellos" 
  ON public.categories FOR SELECT 
  USING ((is_default = TRUE AND user_id IS NULL) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear sus propias categorias" ON public.categories;
CREATE POLICY "Usuarios pueden crear sus propias categorias" 
  ON public.categories FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias categorias" ON public.categories;
CREATE POLICY "Usuarios pueden actualizar sus propias categorias" 
  ON public.categories FOR UPDATE 
  USING (auth.uid() = user_id AND is_default = FALSE);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias categorias" ON public.categories;
CREATE POLICY "Usuarios pueden eliminar sus propias categorias" 
  ON public.categories FOR DELETE 
  USING (auth.uid() = user_id AND is_default = FALSE);

-- 3. TABLA: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS en transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver solo sus transacciones" ON public.transactions;
CREATE POLICY "Usuarios pueden ver solo sus transacciones" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden insertar sus transacciones" ON public.transactions;
CREATE POLICY "Usuarios pueden insertar sus transacciones" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus transacciones" ON public.transactions;
CREATE POLICY "Usuarios pueden actualizar sus transacciones" 
  ON public.transactions FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus transacciones" ON public.transactions;
CREATE POLICY "Usuarios pueden eliminar sus transacciones" 
  ON public.transactions FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. TABLA: budgets
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE, -- NULL indica presupuesto general
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

-- Habilitar RLS en budgets
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios presupuestos" ON public.budgets;
CREATE POLICY "Usuarios pueden ver sus propios presupuestos" 
  ON public.budgets FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden crear sus propios presupuestos" ON public.budgets;
CREATE POLICY "Usuarios pueden crear sus propios presupuestos" 
  ON public.budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios presupuestos" ON public.budgets;
CREATE POLICY "Usuarios pueden actualizar sus propios presupuestos" 
  ON public.budgets FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios presupuestos" ON public.budgets;
CREATE POLICY "Usuarios pueden eliminar sus propios presupuestos" 
  ON public.budgets FOR DELETE 
  USING (auth.uid() = user_id);

-- ====================================================================
-- INDICES DE RENDIMIENTO
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions (user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON public.budgets (user_id, year, month);

-- ====================================================================
-- TRIGGER DE AUTO-CREACIÓN DE PERFIL AL REGISTRARSE
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    'USD'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. LICENCIAS SAAS
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_code TEXT UNIQUE NOT NULL,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'active', 'paused', 'revoked', 'expired')),
  user_email TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.licenses ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS licenses_duration_check;
ALTER TABLE public.licenses ADD CONSTRAINT licenses_duration_check
  CHECK (duration IN ('1_month', '3_months', '6_months', '1_year', 'unlimited'));

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin' AND is_banned = FALSE
  );
$$;

REVOKE ALL ON FUNCTION public.is_superadmin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;

DROP POLICY IF EXISTS "Todos los usuarios pueden buscar licencias para activacion" ON public.licenses;
DROP POLICY IF EXISTS "Usuarios pueden crear licencias" ON public.licenses;
DROP POLICY IF EXISTS "Usuarios pueden actualizar licencias" ON public.licenses;
DROP POLICY IF EXISTS "SuperAdmins gestionan licencias" ON public.licenses;
DROP POLICY IF EXISTS "Usuarios autenticados leen licencias para validación" ON public.licenses;
DROP POLICY IF EXISTS "Usuarios activan licencias no usadas" ON public.licenses;
CREATE POLICY "SuperAdmins gestionan licencias"
  ON public.licenses FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- 6. VINCULACION DE LICENCIAS
CREATE TABLE IF NOT EXISTS public.user_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, license_id)
);

ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su propia vinculacion de licencia" ON public.user_licenses;
DROP POLICY IF EXISTS "Usuarios pueden vincular licencia a su cuenta" ON public.user_licenses;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su vinculacion de licencia" ON public.user_licenses;
DROP POLICY IF EXISTS "Los usuarios ven su propia vinculacion de licencia" ON public.user_licenses;
DROP POLICY IF EXISTS "Los usuarios insertan su vinculacion al activar" ON public.user_licenses;
DROP POLICY IF EXISTS "SuperAdmins gestionan vinculaciones" ON public.user_licenses;
CREATE POLICY "Usuarios pueden ver su propia vinculacion de licencia"
  ON public.user_licenses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "SuperAdmins gestionan vinculaciones"
  ON public.user_licenses FOR ALL
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());

-- La activación valida y consume una clave en una sola transacción.
CREATE OR REPLACE FUNCTION public.activate_license(license_key TEXT, activating_email TEXT DEFAULT NULL)
RETURNS SETOF public.licenses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  selected_license public.licenses%ROWTYPE;
  expiration TIMESTAMPTZ;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'ACTIVATION_ERROR: Debes iniciar sesión para activar una licencia.';
  END IF;

  SELECT * INTO selected_license
  FROM public.licenses
  WHERE key_code = UPPER(TRIM(license_key))
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACTIVATION_ERROR: La clave de licencia ingresada no existe.';
  END IF;
  IF selected_license.status <> 'unused' THEN
    RAISE EXCEPTION 'ACTIVATION_ERROR: Esta licencia ya fue usada o no está disponible.';
  END IF;

  expiration := CASE selected_license.duration
    WHEN '1_month' THEN NOW() + INTERVAL '1 month'
    WHEN '3_months' THEN NOW() + INTERVAL '3 months'
    WHEN '6_months' THEN NOW() + INTERVAL '6 months'
    WHEN '1_year' THEN NOW() + INTERVAL '1 year'
    ELSE NULL
  END;

  UPDATE public.licenses
  SET status = 'active', user_email = activating_email,
      activated_at = NOW(), expires_at = expiration
  WHERE id = selected_license.id
  RETURNING * INTO selected_license;

  INSERT INTO public.user_licenses (user_id, license_id)
  VALUES (current_user_id, selected_license.id)
  ON CONFLICT (user_id, license_id) DO NOTHING;

  RETURN NEXT selected_license;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_license(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_license(TEXT, TEXT) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_licenses_key_code ON public.licenses (key_code);
CREATE INDEX IF NOT EXISTS idx_user_licenses_user ON public.user_licenses (user_id);
