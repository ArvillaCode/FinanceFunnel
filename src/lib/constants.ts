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
  // Gastos (Alineados a la paleta Upfunnel)
  { id: 'cat-1', name: 'Vivienda', icon: 'Home', color: '#00E5FF', type: 'expense', is_default: true },
  { id: 'cat-2', name: 'Alimentación', icon: 'Utensils', color: '#94A3B8', type: 'expense', is_default: true },
  { id: 'cat-3', name: 'Transporte', icon: 'Car', color: '#00E5FF', type: 'expense', is_default: true },
  { id: 'cat-4', name: 'Servicios', icon: 'Zap', color: '#94A3B8', type: 'expense', is_default: true },
  { id: 'cat-5', name: 'Entretenimiento', icon: 'Film', color: '#00E5FF', type: 'expense', is_default: true },
  { id: 'cat-6', name: 'Salud', icon: 'HeartPulse', color: '#94A3B8', type: 'expense', is_default: true },
  { id: 'cat-7', name: 'Educación', icon: 'GraduationCap', color: '#00E5FF', type: 'expense', is_default: true },
  { id: 'cat-8', name: 'Deudas', icon: 'CreditCard', color: '#94A3B8', type: 'expense', is_default: true },
  { id: 'cat-9', name: 'Compras', icon: 'ShoppingBag', color: '#00E5FF', type: 'expense', is_default: true },
  { id: 'cat-10', name: 'Otros', icon: 'MoreHorizontal', color: '#94A3B8', type: 'both', is_default: true },

  // Ingresos
  { id: 'cat-11', name: 'Salario', icon: 'Briefcase', color: '#00E5FF', type: 'income', is_default: true },
  { id: 'cat-12', name: 'Freelance', icon: 'Laptop', color: '#FFFFFF', type: 'income', is_default: true },
  { id: 'cat-13', name: 'Inversiones', icon: 'TrendingUp', color: '#00E5FF', type: 'income', is_default: true },
  { id: 'cat-14', name: 'Ventas', icon: 'Tag', color: '#94A3B8', type: 'income', is_default: true },
];

export const AVAILABLE_ICONS = [
  'Home', 'Utensils', 'Car', 'Zap', 'Film', 'HeartPulse', 'GraduationCap',
  'CreditCard', 'ShoppingBag', 'MoreHorizontal', 'Briefcase', 'Laptop',
  'TrendingUp', 'Tag', 'Coffee', 'Plane', 'Gift', 'Dumbbell', 'Music',
  'BookOpen', 'Wifi', 'Smartphone', 'ShieldCheck', 'DollarSign', 'PiggyBank'
];

export const AVAILABLE_COLORS = [
  '#00E5FF', '#FFFFFF', '#94A3B8', '#080C14'
];
