export interface Profile {
  id: string;
  full_name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category_id: string;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  is_default: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
  categories?: Category;
}

export interface MonthlySummary {
  month: number;
  year: number;
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardData {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  expensePercentage: number;
  previousMonthIncome: number;
  previousMonthExpense: number;
  topCategory: { name: string; amount: number; color: string } | null;
  recentTransactions: Transaction[];
  categoryBreakdown: { category: string; amount: number; color: string; percentage: number }[];
  monthlyData: MonthlySummary[];
  balanceHistory: { month: string; balance: number }[];
  budgetUsage: { used: number; total: number; percentage: number };
}
