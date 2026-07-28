import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { getMonthlyTotals, getCategorySpending, formatCurrency } from '../../lib/utils';
import { AlertCircle, AlertTriangle } from 'lucide-react';
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

  const generalBudget = budgets.find(
    (b) => b.category_id === null && b.month === selectedMonth && b.year === selectedYear
  );

  const totalBudgetAmount = generalBudget?.amount || 2600;
  const generalProgress = Math.min(100, Math.round((expenses / totalBudgetAmount) * 100));

  const activeCategoryBudgets = budgets.filter(
    (b) => b.category_id !== null && b.month === selectedMonth && b.year === selectedYear
  );

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const spendingMap = new Map<string, number>(catSpending.map((s) => [s.category_id, s.amount]));

  return (
    <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#FFFFFF]">
            Presupuesto Mensual
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Estado de tus límites de consumo
          </p>
        </div>
        <button
          onClick={onNavigateBudgets}
          className="text-xs font-bold text-[#00E5FF] hover:underline"
        >
          Gestionar
        </button>
      </div>

      {/* General Budget Progress */}
      <div className="p-4 rounded-xl bg-[#080C14] border border-[#94A3B8]/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#94A3B8]">
            Límite General
          </span>
          <span className="font-extrabold text-[#FFFFFF]">
            {formatCurrency(expenses, currency)} / {formatCurrency(totalBudgetAmount, currency)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-[#94A3B8]/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              generalProgress >= 100
                ? 'bg-[#FFFFFF]'
                : 'bg-[#00E5FF]'
            }`}
            style={{ width: `${generalProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
          <span>{generalProgress}% Utilizado</span>
          <span className="font-semibold text-[#FFFFFF]">
            {totalBudgetAmount - expenses >= 0
              ? `${formatCurrency(totalBudgetAmount - expenses, currency)} restante`
              : `Excedido por ${formatCurrency(Math.abs(totalBudgetAmount - expenses), currency)}`}
          </span>
        </div>
      </div>

      {/* Category Limits Preview */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
          Límites por Categoría
        </h4>

        {activeCategoryBudgets.length === 0 ? (
          <p className="text-xs text-[#94A3B8] italic">No has configurado límites por categoría para este mes.</p>
        ) : (
          <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
            {activeCategoryBudgets.map((b) => {
              const cat = categoryMap.get(b.category_id!) || {
                id: b.category_id || '',
                name: 'Categoría',
                icon: 'PieChart',
                color: '#00E5FF',
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
                      <IconHelper name={cat.icon} className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span className="font-semibold text-[#FFFFFF] truncate">
                        {cat.name}
                      </span>
                      {isExceeded && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 font-bold bg-[#FFFFFF]/10 text-[#FFFFFF] border border-[#FFFFFF]/30 rounded-md">
                          <AlertCircle className="w-2.5 h-2.5" /> Excedido
                        </span>
                      )}
                      {isWarning && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 rounded-md">
                          <AlertTriangle className="w-2.5 h-2.5" /> 80%+
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-[#94A3B8]">
                      {formatCurrency(spent, currency)} / {formatCurrency(b.amount, currency)}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#94A3B8]/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isExceeded
                          ? 'bg-[#FFFFFF]'
                          : 'bg-[#00E5FF]'
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
