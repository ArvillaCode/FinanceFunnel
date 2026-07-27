import { Category, CurrencyCode, CurrencyConfig } from '../types';

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'Dólar Estadounidense (USD)', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro (EUR)', locale: 'es-ES' },
  MXN: { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)', locale: 'es-MX' },
  COP: { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP)', locale: 'es-CO' },
  ARS: { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)', locale: 'es-AR' },
  CLP: { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP)', locale: 'es-CL' },
  PEN: { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (PEN)', locale: 'es-PE' },
};

export const DEFAULT_CATEGORIES: Category[] = [
  // Gastos
  { id: 'cat-1', name: 'Vivienda', icon: 'Home', color: '#3b82f6', type: 'expense', is_default: true },
  { id: 'cat-2', name: 'Alimentación', icon: 'Utensils', color: '#ef4444', type: 'expense', is_default: true },
  { id: 'cat-3', name: 'Transporte', icon: 'Car', color: '#f59e0b', type: 'expense', is_default: true },
  { id: 'cat-4', name: 'Servicios', icon: 'Zap', color: '#8b5cf6', type: 'expense', is_default: true },
  { id: 'cat-5', name: 'Entretenimiento', icon: 'Film', color: '#ec4899', type: 'expense', is_default: true },
  { id: 'cat-6', name: 'Salud', icon: 'HeartPulse', color: '#10b981', type: 'expense', is_default: true },
  { id: 'cat-7', name: 'Educación', icon: 'GraduationCap', color: '#06b6d4', type: 'expense', is_default: true },
  { id: 'cat-8', name: 'Deudas', icon: 'CreditCard', color: '#64748b', type: 'expense', is_default: true },
  { id: 'cat-9', name: 'Compras', icon: 'ShoppingBag', color: '#f97316', type: 'expense', is_default: true },
  { id: 'cat-10', name: 'Otros', icon: 'MoreHorizontal', color: '#94a3b8', type: 'both', is_default: true },

  // Ingresos
  { id: 'cat-11', name: 'Salario', icon: 'Briefcase', color: '#22c55e', type: 'income', is_default: true },
  { id: 'cat-12', name: 'Freelance', icon: 'Laptop', color: '#14b8a6', type: 'income', is_default: true },
  { id: 'cat-13', name: 'Inversiones', icon: 'TrendingUp', color: '#6366f1', type: 'income', is_default: true },
  { id: 'cat-14', name: 'Ventas', icon: 'Tag', color: '#a855f7', type: 'income', is_default: true },
];

export const AVAILABLE_ICONS = [
  'Home', 'Utensils', 'Car', 'Zap', 'Film', 'HeartPulse', 'GraduationCap',
  'CreditCard', 'ShoppingBag', 'MoreHorizontal', 'Briefcase', 'Laptop',
  'TrendingUp', 'Tag', 'Coffee', 'Plane', 'Gift', 'Dumbbell', 'Music',
  'BookOpen', 'Wifi', 'Smartphone', 'ShieldCheck', 'DollarSign', 'PiggyBank'
];

export const AVAILABLE_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899',
  '#10b981', '#06b6d4', '#64748b', '#f97316', '#22c55e',
  '#14b8a6', '#6366f1', '#a855f7', '#d97706', '#0284c7'
];
