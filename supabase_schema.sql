-- ====================================================================
-- ESQUEMA COMPLETO SAAS MULTI-TENANT & LICENCIAS (FINANCEFUNNEL)
-- ====================================================================

-- 1. Ampliación de Perfiles con Roles y Estado de Baneo
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver propios perfiles o superadmin" ON public.profiles;
CREATE POLICY "Ver propios perfiles o superadmin" 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

DROP POLICY IF EXISTS "Actualizar propios perfiles o superadmin" ON public.profiles;
CREATE POLICY "Actualizar propios perfiles o superadmin" 
  ON public.profiles FOR UPDATE 
  USING (
    auth.uid() = id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );


-- 2. Tabla de Licencias SaaS
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_code TEXT UNIQUE NOT NULL,
  duration TEXT CHECK (duration IN ('1_month', '3_months', '6_months', '1_year', 'unlimited')) NOT NULL,
  status TEXT CHECK (status IN ('unused', 'active', 'paused', 'revoked', 'expired')) DEFAULT 'unused',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins gestionan licencias" 
  ON public.licenses FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Usuarios autenticados leen licencias para validación" 
  ON public.licenses FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios activan licencias no usadas" 
  ON public.licenses FOR UPDATE 
  USING (auth.role() = 'authenticated');


-- 3. Tabla de Vinculación Usuario - Licencia
CREATE TABLE IF NOT EXISTS public.user_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, license_id)
);

ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios ven su propia vinculacion de licencia" 
  ON public.user_licenses FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Los usuarios insertan su vinculacion al activar" 
  ON public.user_licenses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "SuperAdmins gestionan vinculaciones" 
  ON public.user_licenses FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );


-- 4. Tabla de Auditoría (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SuperAdmins ven todos los registros de auditoria" 
  ON public.audit_logs FOR SELECT 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

CREATE POLICY "Cualquier usuario autenticado registra eventos" 
  ON public.audit_logs FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');


-- 5. Función de Verificación de Licencia Activa (Para RLS de revocación inmediata)
CREATE OR REPLACE FUNCTION public.has_active_license(check_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_superadmin BOOLEAN;
  has_valid_license BOOLEAN;
BEGIN
  -- SuperAdmin siempre tiene acceso
  SELECT (role = 'superadmin') INTO is_superadmin
  FROM public.profiles WHERE id = check_user_id;
  
  IF is_superadmin THEN
    RETURN TRUE;
  END IF;

  -- Verificar si el usuario posee al menos 1 licencia activa y no expirada
  SELECT EXISTS (
    SELECT 1 FROM public.user_licenses ul
    JOIN public.licenses l ON ul.license_id = l.id
    WHERE ul.user_id = check_user_id
      AND l.status = 'active'
      AND (l.expires_at IS NULL OR l.expires_at > NOW())
  ) INTO has_valid_license;

  RETURN has_valid_license;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Actualización de Políticas RLS de Datos (Transacciones, Categorías, Presupuestos)
-- Garantiza que si una licencia es revocada o pausada, las consultas fallen inmediatamente (403)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso a transacciones condicionado a licencia activa" ON public.transactions;
CREATE POLICY "Acceso a transacciones condicionado a licencia activa" 
  ON public.transactions FOR ALL 
  USING (auth.uid() = user_id AND public.has_active_license(auth.uid()));

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acceso a presupuestos condicionado a licencia activa" ON public.budgets;
CREATE POLICY "Acceso a presupuestos condicionado a licencia activa" 
  ON public.budgets FOR ALL 
  USING (auth.uid() = user_id AND public.has_active_license(auth.uid()));
