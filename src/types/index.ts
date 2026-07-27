export type TransactionType = 'income' | 'expense';

export type CategoryType = 'income' | 'expense' | 'both';

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string; // Lucide icon name
  color: string; // Hex color code or Tailwind color class
  type: CategoryType;
  is_default?: boolean;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string;
  transaction_date: string; // YYYY-MM-DD
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id?: string;
  category_id?: string | null; // null for overall general budget
  amount: number; // limit amount
  month: number; // 1 - 12
  year: number; // e.g. 2026
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  currency: CurrencyCode;
  avatar_url?: string;
  monthly_budget_target?: number;
  created_at?: string;
  updated_at?: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'MXN' | 'COP' | 'ARS' | 'CLP' | 'PEN';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  locale: string;
}

export interface TransactionFilter {
  search: string;
  type: 'all' | 'income' | 'expense';
  category_id: string;
  startDate: string;
  endDate: string;
  minAmount: string;
  maxAmount: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

export interface MonthlySummary {
  monthName: string; // e.g. "Feb 2026"
  yearMonth: string; // "2026-02"
  income: number;
  expenses: number;
  balance: number;
}

export interface CategorySpending {
  category_id: string;
  category_name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface UserAuthSession {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  } | null;
  isDemo: boolean;
}
