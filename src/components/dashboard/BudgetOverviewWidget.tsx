import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { getMonthlyTotals, getCategorySpending, formatCurrency } from '../../lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2, PieChart as PieIcon } from 'lucide-react';
import { IconHelper } from '../ui/IconHelper';
import { Category } from '../../types';

interface BudgetOverviewWidgetProps {
  onNavigateBudgets: () => void;
}

export const BudgetOverviewWidget: React.FC<BudgetOverviewWidgetProps> = ({
  onNavigateBudgets,
}) => {
  const {
    transactions,
    categories,
    budgets,
    selectedMonth,
    selectedYear,
    currency,
  } = useFinance();

  const { expenses } = getMonthlyTotals(transactions, selectedYear, selectedMonth);
  const catSpending = getCategorySpending(transactions, categories, selectedYear, selectedMonth);

  // Find general overall budget
  const generalBudget = budgets.find(
    (b) => b.category_id === null && b.month === selectedMonth && b.year === selectedYear
  );

  const totalBudgetAmount = generalBudget?.amount || 2600;
  const generalProgress = Math.min(100, Math.round((expenses / totalBudgetAmount) * 100));

  // Category specific budgets
  const activeCategoryBudgets = budgets.filter(
    (b) => b.category_id !== null && b.month === selectedMonth && b.year === selectedYear
  );

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const spendingMap = new Map<string, number>(catSpending.map((s) => [s.category_id, s.amount]));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Presupuesto Mensual
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Estado de tus límites de consumo
          </p>
        </div>
        <button
          onClick={onNavigateBudgets}
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Gestionar
        </button>
      </div>

      {/* General Budget Progress */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Límite General
          </span>
          <span className="font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(expenses, currency)} / {formatCurrency(totalBudgetAmount, currency)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              generalProgress >= 100
                ? 'bg-rose-500'
                : generalProgress >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${generalProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{generalProgress}% Utilizado</span>
          <span>
            {totalBudgetAmount - expenses >= 0
              ? `${formatCurrency(totalBudgetAmount - expenses, currency)} restante`
              : `Excedido por ${formatCurrency(Math.abs(totalBudgetAmount - expenses), currency)}`}
          </span>
        </div>
      </div>

      {/* Category Limits Preview */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Límites por Categoría
        </h4>

        {activeCategoryBudgets.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No has configurado límites por categoría para este mes.</p>
        ) : (
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {activeCategoryBudgets.map((b) => {
              const cat = categoryMap.get(b.category_id!) || {
                id: b.category_id || '',
                name: 'Categoría',
                icon: 'PieChart',
                color: '#6366f1',
                type: 'expense' as const,
              };
              const spent = spendingMap.get(b.category_id!) || 0;
              const pct = Math.min(100, Math.round((spent / b.amount) * 100));
              const isExceeded = spent > b.amount;
              const isWarning = pct >= 80 && !isExceeded;

              return (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <IconHelper name={cat.icon} className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                      {isExceeded && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-md">
                          <AlertCircle className="w-2.5 h-2.5" /> Excedido
                        </span>
                      )}
                      {isWarning && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-md">
                          <AlertTriangle className="w-2.5 h-2.5" /> 80%+
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {formatCurrency(spent, currency)} / {formatCurrency(b.amount, currency)}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isExceeded
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
