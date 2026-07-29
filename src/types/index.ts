export type TransactionType = 'income' | 'expense';

export type CategoryType = 'income' | 'expense' | 'both';

export type UserRole = 'user' | 'superadmin';

export type LicenseDuration = '1_month' | '3_months' | '6_months' | '1_year' | 'unlimited';

export type LicenseStatus = 'unused' | 'active' | 'paused' | 'revoked' | 'expired';

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

export type PlanTier = 'starter' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  avatar_url?: string;
  owner_id: string;
  plan_tier: PlanTier;
  member_count?: number;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: OrgRole;
  avatar_url?: string;
  joined_at: string;
}

export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  status: 'pending' | 'accepted' | 'declined';
  token: string;
  created_at: string;
  expires_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  organization_id?: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  is_default?: boolean;
  created_at?: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  organization_id?: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string;
  transaction_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Budget {
  id: string;
  user_id?: string;
  organization_id?: string;
  category_id?: string | null;
  amount: number;
  month: number;
  year: number;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role?: UserRole;
  is_banned?: boolean;
  currency: CurrencyCode;
  avatar_url?: string;
  monthly_budget_target?: number;
  current_organization_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface License {
  id: string;
  key_code: string;
  duration: LicenseDuration;
  status: LicenseStatus;
  created_at: string;
  activated_at?: string | null;
  expires_at?: string | null;
  created_by?: string;
  user_email?: string | null;
}

export interface UserLicense {
  id: string;
  user_id: string;
  license_id: string;
  assigned_at?: string;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  details?: string;
  created_at: string;
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
  monthName: string;
  yearMonth: string;
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
