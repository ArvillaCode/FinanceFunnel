import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, subMonths, isSameMonth, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { CurrencyCode, Transaction, Budget, Category, CategorySpending, MonthlySummary } from '../types';
import { CURRENCIES } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode: CurrencyCode = 'USD'): string {
  const config = CURRENCIES[currencyCode] || CURRENCIES.USD;
  try {
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${config.symbol}${amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
  }
}

export function formatDate(dateString: string, pattern: string = 'd MMM, yyyy'): string {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return format(date, pattern, { locale: es });
  } catch {
    return dateString;
  }
}

export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // 1-12
  };
}

// Calculate totals for a given month & year
export function getMonthlyTotals(transactions: Transaction[], year: number, month: number) {
  const filtered = transactions.filter((t) => {
    if (!t.transaction_date) return false;
    const date = parseISO(t.transaction_date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const income = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = income - expenses;
  const percentageSpent = income > 0 ? (expenses / income) * 100 : 0;

  return { income, expenses, balance, percentageSpent, count: filtered.length };
}

// Get spending breakdown by category for a specific month
export function getCategorySpending(
  transactions: Transaction[],
  categories: Category[],
  year: number,
  month: number
): CategorySpending[] {
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  const monthExpenses = transactions.filter((t) => {
    if (t.type !== 'expense' || !t.transaction_date) return false;
    const date = parseISO(t.transaction_date);
    return date.getFullYear() === year && date.getMonth() + 1 === month;
  });

  const totalExpense = monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0);

  const spendingByCat = new Map<string, number>();
  monthExpenses.forEach((t) => {
    const current = spendingByCat.get(t.category_id) || 0;
    spendingByCat.set(t.category_id, current + Number(t.amount));
  });

  const result: CategorySpending[] = [];

  spendingByCat.forEach((amount, catId) => {
    const cat = categoryMap.get(catId) || {
      id: catId,
      name: 'Sin categoría',
      color: '#94a3b8',
      icon: 'MoreHorizontal',
      type: 'expense',
    };

    result.push({
      category_id: catId,
      category_name: cat.name,
      color: cat.color,
      icon: cat.icon,
      amount,
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    });
  });

  return result.sort((a, b) => b.amount - a.amount);
}

// Get last 6 months summary for charts
export function getLast6MonthsSummary(transactions: Transaction[]): MonthlySummary[] {
  const summaries: MonthlySummary[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const targetDate = subMonths(now, i);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const monthName = format(targetDate, 'MMM yyyy', { locale: es });
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

    const { income, expenses, balance } = getMonthlyTotals(transactions, year, month);

    summaries.push({
      monthName,
      yearMonth,
      income,
      expenses,
      balance,
    });
  }

  return summaries;
}

// Get accumulated 6 months running balance trajectory
export function get6MonthsBalanceTrajectory(transactions: Transaction[]) {
  const summaries = getLast6MonthsSummary(transactions);
  let runningBalance = 0;

  return summaries.map((s) => {
    runningBalance += s.balance;
    return {
      monthName: s.monthName,
      saldo: Math.max(0, runningBalance), // visual representation
      ingresos: s.income,
      gastos: s.expenses,
      flujo: s.balance,
    };
  });
}

// Export transactions to CSV
export function exportToCSV(transactions: Transaction[], categories: Category[], filename = 'transacciones.csv') {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const headers = ['ID', 'Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Notas'];

  const rows = transactions.map((t) => [
    t.id,
    t.transaction_date,
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    catMap.get(t.category_id) || 'Sin Categoría',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
