import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { getMonthlyTotals, getCategorySpending } from '../../lib/utils';
import { MetricCard } from './MetricCard';
import { ExpensePieChart } from './ExpensePieChart';
import { IncomeExpenseBarChart } from './IncomeExpenseBarChart';
import { BalanceLineChart } from './BalanceLineChart';
import { RecentTransactions } from './RecentTransactions';
import { BudgetOverviewWidget } from './BudgetOverviewWidget';
import { Wallet, TrendingUp, TrendingDown, ShoppingBag } from 'lucide-react';
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

  return (
    <div className="space-y-6">
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
