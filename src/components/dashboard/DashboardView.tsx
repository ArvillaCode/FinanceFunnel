import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { getMonthlyTotals, getCategorySpending, formatCurrency } from '../../lib/utils';
import { MetricCard } from './MetricCard';
import { ExpensePieChart } from './ExpensePieChart';
import { IncomeExpenseBarChart } from './IncomeExpenseBarChart';
import { BalanceLineChart } from './BalanceLineChart';
import { RecentTransactions } from './RecentTransactions';
import { BudgetOverviewWidget } from './BudgetOverviewWidget';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  ShoppingBag,
  Target,
  ArrowRight,
} from 'lucide-react';
import { subMonths } from 'date-fns';
import { Transaction } from '../../types';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenNewTxModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onEditTransaction,
  onOpenNewTxModal,
}) => {
  const {
    transactions,
    categories,
    budgets,
    selectedMonth,
    selectedYear,
    currency,
  } = useFinance();

  // Current month metrics
  const currentTotals = getMonthlyTotals(transactions, selectedYear, selectedMonth);

  // Previous month comparison
  const prevDate = subMonths(new Date(selectedYear, selectedMonth - 1, 1), 1);
  const prevTotals = getMonthlyTotals(transactions, prevDate.getFullYear(), prevDate.getMonth() + 1);

  // Income trend vs previous month
  const incomeTrendPct =
    prevTotals.income > 0
      ? ((currentTotals.income - prevTotals.income) / prevTotals.income) * 100
      : 0;

  // Expense trend vs previous month
  const expenseTrendPct =
    prevTotals.expenses > 0
      ? ((currentTotals.expenses - prevTotals.expenses) / prevTotals.expenses) * 100
      : 0;

  // Category with highest expense
  const catSpendings = getCategorySpending(transactions, categories, selectedYear, selectedMonth);
  const topCategory = catSpendings[0] || null;

  // General budget target
  const generalBudget = budgets.find(
    (b) => b.category_id === null && b.month === selectedMonth && b.year === selectedYear
  );
  const totalBudgetAmount = generalBudget?.amount || 2600;
  const budgetUsedPct = Math.min(100, Math.round((currentTotals.expenses / totalBudgetAmount) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              Resumen Financiero
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-1">
              Hola, ¡bienvenido a tu dashboard!
            </h2>
            <p className="text-xs text-indigo-200 mt-1 max-w-lg">
              Tienes un saldo neto de{' '}
              <strong className="text-white underline">
                {formatCurrency(currentTotals.balance, currency)}
              </strong>{' '}
              este mes. Revisa tus gráficos e indicadores a continuación.
            </p>
          </div>

          <button
            onClick={onOpenNewTxModal}
            className="self-start md:self-auto px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
          >
            + Registrar Ingreso/Gasto
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <MetricCard
          title="Saldo Disponible"
          amount={currentTotals.balance}
          icon={Wallet}
          accentColor="indigo"
          subtitle={`${currentTotals.count} transacciones este mes`}
          delay={0.05}
        />

        {/* Monthly Income */}
        <MetricCard
          title="Ingresos del Mes"
          amount={currentTotals.income}
          icon={TrendingUp}
          accentColor="emerald"
          trend={{
            percentage: incomeTrendPct,
            isPositive: incomeTrendPct >= 0,
            label: 'vs mes ant.',
          }}
          delay={0.1}
        />

        {/* Monthly Expenses */}
        <MetricCard
          title="Gastos del Mes"
          amount={currentTotals.expenses}
          icon={TrendingDown}
          accentColor="rose"
          trend={{
            percentage: expenseTrendPct,
            isPositive: expenseTrendPct <= 0, // Less expenses is good
            label: 'vs mes ant.',
          }}
          delay={0.15}
        />

        {/* Category with Highest Expense */}
        <MetricCard
          title="Mayor Categoría"
          amount={topCategory ? topCategory.amount : 0}
          icon={ShoppingBag}
          accentColor="amber"
          subtitle={
            topCategory
              ? `${topCategory.category_name} (${topCategory.percentage.toFixed(0)}%)`
              : 'Sin gastos registrados'
          }
          delay={0.2}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Monthly Bar Chart */}
        <div className="lg:col-span-2">
          <IncomeExpenseBarChart />
        </div>

        {/* Expense Category Donut Chart */}
        <div>
          <ExpensePieChart />
        </div>
      </div>

      {/* Balance Evolution & Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Evolution 6-Month Trajectory */}
        <div className="lg:col-span-2">
          <BalanceLineChart />
        </div>

        {/* Budget Progress Widget */}
        <div>
          <BudgetOverviewWidget onNavigateBudgets={() => onNavigate('budgets')} />
        </div>
      </div>

      {/* Recent Transactions List */}
      <div>
        <RecentTransactions
          onNavigateTransactions={() => onNavigate('transactions')}
          onEditTransaction={onEditTransaction}
        />
      </div>
    </div>
  );
};
