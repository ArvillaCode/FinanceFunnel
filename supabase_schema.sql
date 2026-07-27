-- ====================================================================
-- SCHEMA COMPLETO PARA FINANCEFUNNEL CON AUTENTICACIÓN Y RLS (SUPABASE)
-- ====================================================================

-- 1. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  currency TEXT DEFAULT 'USD',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden ver su propio perfil" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Los usuarios pueden insertar su propio perfil" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Trigger para crear automáticamente el perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, currency)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    new.email, 
    'USD'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Tabla de Categorías
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Tag',
  color TEXT DEFAULT '#00E5FF',
  type TEXT CHECK (type IN ('income', 'expense', 'both')) DEFAULT 'expense',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios pueden gestionar sus categorías" 
  ON public.categories FOR ALL 
  USING (auth.uid() = user_id OR is_default = true);


-- 3. Tabla de Transacciones
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category_id UUID,
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios ven sus propias transacciones" 
  ON public.transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios insertan sus propias transacciones" 
  ON public.transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios actualizan sus propias transacciones" 
  ON public.transactions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios eliminan sus propias transacciones" 
  ON public.transactions FOR DELETE 
  USING (auth.uid() = user_id);


-- 4. Tabla de Presupuestos
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  category_id UUID,
  amount NUMERIC(12, 2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios ven sus propios presupuestos" 
  ON public.budgets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios insertan sus propios presupuestos" 
  ON public.budgets FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios actualizan sus propios presupuestos" 
  ON public.budgets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios eliminan sus propios presupuestos" 
  ON public.budgets FOR DELETE 
  USING (auth.uid() = user_id);
