import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { getMonthlyTotals, getCategorySpending, formatCurrency } from '../../lib/utils';
import { IconHelper } from '../ui/IconHelper';
import { Modal } from '../ui/Modal';
import { Category } from '../../types';
import {
  PieChart,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';

export const BudgetManager: React.FC = () => {
  const {
    transactions,
    categories,
    budgets,
    setCategoryBudget,
    deleteBudget,
    selectedMonth,
    selectedYear,
    currency,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null); // null for general overall budget
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const { expenses } = getMonthlyTotals(transactions, selectedYear, selectedMonth);
  const catSpending = getCategorySpending(transactions, categories, selectedYear, selectedMonth);

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const spendingMap = new Map<string, number>(catSpending.map((s) => [s.category_id, s.amount]));

  // General monthly budget
  const generalBudget = budgets.find(
    (b) => b.category_id === null && b.month === selectedMonth && b.year === selectedYear
  );
  const totalGeneralLimit = generalBudget?.amount || 2600;
  const generalPct = Math.min(100, Math.round((expenses / totalGeneralLimit) * 100));

  // Category limits
  const activeCategoryBudgets = budgets.filter(
    (b) => b.category_id !== null && b.month === selectedMonth && b.year === selectedYear
  );

  const openBudgetModal = (catId: string | null = null, currentAmount: number = 0) => {
    setTargetCategoryId(catId);
    setAmount(currentAmount > 0 ? currentAmount.toString() : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Ingresa un monto límite válido mayor a 0');
      return;
    }

    setCategoryBudget(targetCategoryId, parsed);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Presupuestos y Límites de Gasto
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Establece metas mensuales para mantener el control total de tus gastos
          </p>
        </div>

        <button
          onClick={() => openBudgetModal(null, totalGeneralLimit)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Edit2 className="w-4 h-4" />
          <span>Configurar Presupuesto General</span>
        </button>
      </div>

      {/* Main General Budget Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Presupuesto Mensual General
            </span>
            <h3 className="text-2xl font-extrabold mt-0.5">
              {formatCurrency(expenses, currency)}{' '}
              <span className="text-slate-400 text-sm font-normal">
                de {formatCurrency(totalGeneralLimit, currency)}
              </span>
            </h3>
          </div>

          <button
            onClick={() => openBudgetModal(null, totalGeneralLimit)}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors self-start sm:self-auto"
          >
            Editar Límite
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                generalPct >= 100
                  ? 'bg-rose-500'
                  : generalPct >= 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${generalPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-indigo-200">
            <span>{generalPct}% del presupuesto utilizado</span>
            <span>
              {totalGeneralLimit - expenses >= 0
                ? `${formatCurrency(totalGeneralLimit - expenses, currency)} disponible`
                : `¡Excedido por ${formatCurrency(Math.abs(totalGeneralLimit - expenses), currency)}!`}
            </span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Límites por Categoría
          </h3>
          <button
            onClick={() => openBudgetModal(categories[0]?.id || null, 0)}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Límite a Categoría</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories
            .filter((c) => c.type === 'expense' || c.type === 'both')
            .map((cat) => {
              const existingBudget = activeCategoryBudgets.find(
                (b) => b.category_id === cat.id
              );
              const spent = spendingMap.get(cat.id) || 0;
              const limit = existingBudget?.amount || 0;
              const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
              const isExceeded = limit > 0 && spent > limit;
              const isWarning = limit > 0 && pct >= 80 && !isExceeded;

              return (
                <div
                  key={cat.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all ${
                    isExceeded
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10'
                      : isWarning
                      ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
                      >
                        <IconHelper name={cat.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Gasto actual: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(spent, currency)}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openBudgetModal(cat.id, limit)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Configurar Límite"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {limit > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">
                          Límite: {formatCurrency(limit, currency)}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            isExceeded
                              ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                              : isWarning
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isExceeded && <AlertCircle className="w-3.5 h-3.5" />}
                          {isWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                          {pct}%
                        </span>
                      </div>

                      {/* Animated Progress bar */}
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isExceeded
                              ? 'bg-rose-500'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Warning & Danger Notices */}
                      {isExceeded && (
                        <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                          ⚠️ ¡Has superado el límite asignado para esta categoría!
                        </p>
                      )}
                      {isWarning && (
                        <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1">
                          ⚡ Atención: Has alcanzado el 80% o más del presupuesto.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 italic">Sin límite asignado</span>
                      <button
                        onClick={() => openBudgetModal(cat.id, 0)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Establecer límite
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Modal for setting budget */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          targetCategoryId
            ? `Límite para ${categoryMap.get(targetCategoryId)?.name || 'Categoría'}`
            : 'Presupuesto General del Mes'
        }
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {targetCategoryId && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoría
              </label>
              <select
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              >
                {categories
                  .filter((c) => c.type === 'expense' || c.type === 'both')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Límite Máximo Mensual ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="10"
                placeholder="Ej. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
              />
            </div>
            {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
            >
              Guardar Presupuesto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
