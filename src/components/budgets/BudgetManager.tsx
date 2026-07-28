import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { getMonthlyTotals, getCategorySpending, formatCurrency } from '../../lib/utils';
import { IconHelper } from '../ui/IconHelper';
import { Modal } from '../ui/Modal';
import { Category } from '../../types';
import {
  DollarSign,
  AlertTriangle,
  AlertCircle,
  Plus,
  Edit2,
} from 'lucide-react';

export const BudgetManager: React.FC = () => {
  const {
    transactions,
    categories,
    budgets,
    setCategoryBudget,
    selectedMonth,
    selectedYear,
    currency,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetCategoryId, setTargetCategoryId] = useState<string | null>(null);
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
          <h2 className="text-xl font-bold text-[#FFFFFF]">
            Presupuestos y Límites de Gasto
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Establece metas mensuales para mantener el control total de tus gastos
          </p>
        </div>

        <button
          onClick={() => openBudgetModal(null, totalGeneralLimit)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-bold shadow-md shadow-[#00E5FF]/20 transition-all self-start sm:self-auto uf-glow-sm"
        >
          <Edit2 className="w-4 h-4" />
          <span>Configurar Presupuesto General</span>
        </button>
      </div>

      {/* Main General Budget Banner */}
      <div className="p-6 rounded-2xl bg-[#080C14] border border-[#00E5FF]/30 text-[#FFFFFF] shadow-xl space-y-4 uf-glow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-[#00E5FF] uppercase tracking-wider">
              Presupuesto Mensual General
            </span>
            <h3 className="text-2xl font-extrabold mt-0.5 text-[#FFFFFF]">
              {formatCurrency(expenses, currency)}{' '}
              <span className="text-[#94A3B8] text-sm font-normal">
                de {formatCurrency(totalGeneralLimit, currency)}
              </span>
            </h3>
          </div>

          <button
            onClick={() => openBudgetModal(null, totalGeneralLimit)}
            className="px-3.5 py-1.5 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            Editar Límite
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-[#94A3B8]/15 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                generalPct >= 100 ? 'bg-[#FFFFFF]' : 'bg-[#00E5FF]'
              }`}
              style={{ width: `${generalPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>{generalPct}% del presupuesto utilizado</span>
            <span className="font-semibold text-[#FFFFFF]">
              {totalGeneralLimit - expenses >= 0
                ? `${formatCurrency(totalGeneralLimit - expenses, currency)} disponible`
                : `Excedido por ${formatCurrency(Math.abs(totalGeneralLimit - expenses), currency)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#FFFFFF]">
            Límites por Categoría
          </h3>
          <button
            onClick={() => openBudgetModal(categories[0]?.id || null, 0)}
            className="flex items-center gap-1 text-xs font-bold text-[#00E5FF] hover:underline"
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
                  className={`p-5 rounded-2xl bg-[#080C14] border transition-all ${
                    isExceeded
                      ? 'border-[#FFFFFF] bg-[#FFFFFF]/5'
                      : isWarning
                      ? 'border-[#00E5FF]/50 bg-[#00E5FF]/5'
                      : 'border-[#94A3B8]/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] flex items-center justify-center shrink-0">
                        <IconHelper name={cat.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[#FFFFFF]">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-[#94A3B8]">
                          Gasto actual: <span className="font-semibold text-[#FFFFFF]">{formatCurrency(spent, currency)}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openBudgetModal(cat.id, limit)}
                      className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                      title="Configurar Límite"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {limit > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#94A3B8]">
                          Límite: {formatCurrency(limit, currency)}
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            isExceeded
                              ? 'text-[#FFFFFF] font-extrabold'
                              : isWarning
                              ? 'text-[#00E5FF] font-bold'
                              : 'text-[#00E5FF]'
                          }`}
                        >
                          {isExceeded && <AlertCircle className="w-3.5 h-3.5 text-[#FFFFFF]" />}
                          {isWarning && <AlertTriangle className="w-3.5 h-3.5 text-[#00E5FF]" />}
                          {pct}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2.5 bg-[#94A3B8]/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isExceeded
                              ? 'bg-[#FFFFFF]'
                              : 'bg-[#00E5FF]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Warning & Danger Notices */}
                      {isExceeded && (
                        <p className="text-[11px] font-semibold text-[#FFFFFF] mt-1">
                          ⚠️ ¡Has superado el límite asignado para esta categoría!
                        </p>
                      )}
                      {isWarning && (
                        <p className="text-[11px] font-semibold text-[#00E5FF] mt-1">
                          ⚡ Atención: Has alcanzado el 80% o más del presupuesto.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-[#94A3B8]/15 flex items-center justify-between">
                      <span className="text-xs text-[#94A3B8] italic">Sin límite asignado</span>
                      <button
                        onClick={() => openBudgetModal(cat.id, 0)}
                        className="text-xs font-bold text-[#00E5FF] hover:underline"
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
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Categoría
              </label>
              <select
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
              >
                {categories
                  .filter((c) => c.type === 'expense' || c.type === 'both')
                  .map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#080C14] text-[#FFFFFF]">
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Límite Máximo Mensual ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="number"
                step="10"
                placeholder="Ej. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-sm font-bold text-[#FFFFFF] focus:border-[#00E5FF]"
              />
            </div>
            {error && <p className="text-xs text-[#FFFFFF] font-bold mt-1">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#94A3B8]/20">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-bold hover:text-[#FFFFFF]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-bold hover:bg-[#00E5FF]/90 uf-glow-sm"
            >
              Guardar Presupuesto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
