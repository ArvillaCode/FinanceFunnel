-- =============================================================
-- FinanceFunnel - Seed Data
-- Ejecutar después de que un usuario se haya registrado.
-- Reemplaza USER_UUID con el ID real del usuario.
-- =============================================================

-- 1. Insertar categorías predeterminadas (ya se insertan al registrarse)
-- Solo como referencia:

-- INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
--   ('USER_UUID', 'Vivienda', 'home', '#ef4444', 'expense', true),
--   ('USER_UUID', 'Alimentación', 'utensils-crossed', '#f97316', 'expense', true),
--   ('USER_UUID', 'Transporte', 'car', '#eab308', 'expense', true),
--   ('USER_UUID', 'Servicios', 'zap', '#22c55e', 'expense', true),
--   ('USER_UUID', 'Entretenimiento', 'gamepad-2', '#14b8a6', 'expense', true),
--   ('USER_UUID', 'Salud', 'heart-pulse', '#06b6d4', 'expense', true),
--   ('USER_UUID', 'Educación', 'graduation-cap', '#8b5cf6', 'expense', true),
--   ('USER_UUID', 'Deudas', 'landmark', '#d946ef', 'expense', true),
--   ('USER_UUID', 'Compras', 'shopping-bag', '#ec4899', 'expense', true),
--   ('USER_UUID', 'Otros', 'circle', '#6b7280', 'both', true),
--   ('USER_UUID', 'Salario', 'briefcase', '#22c55e', 'income', true),
--   ('USER_UUID', 'Freelance', 'laptop', '#3b82f6', 'income', true),
--   ('USER_UUID', 'Inversiones', 'trending-up', '#8b5cf6', 'income', true);

-- 2. Transacciones de demostración (últimos 6 meses)
-- Reemplaza CAT_XXX con los IDs reales de las categorías
-- Reemplaza USER_UUID con el ID del usuario

/*
-- Ejemplo de ingresos
INSERT INTO transactions (user_id, type, amount, description, category_id, transaction_date) VALUES
-- Obtener category_id para 'Salario'
-- SELECT id FROM categories WHERE name = 'Salario' AND (user_id = 'USER_UUID' OR is_default = true) LIMIT 1;

-- Se recomienda ejecutar desde la aplicación directamente.
-- La interfaz de FinanceFunnel permite crear transacciones fácilmente.
*/

-- =============================================================
-- NOTA: Los datos de demostración se crean desde el frontend
-- usando el formulario de transacciones. Este script es solo
-- una referencia para poblar la base de datos manualmente.
-- =============================================================
