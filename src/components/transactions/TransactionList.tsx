import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, exportToCSV } from '../../lib/utils';
import { IconHelper } from '../ui/IconHelper';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Transaction, Category } from '../../types';

interface TransactionListProps {
  onEditTransaction: (tx: Transaction) => void;
  onOpenNewTxModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onEditTransaction,
  onOpenNewTxModal,
}) => {
  const {
    filteredTransactions,
    categories,
    filter,
    setFilter,
    resetFilter,
    deleteTransaction,
    currency,
  } = useFinance();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Calculate totals for currently filtered list
  const filteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Historial de Transacciones
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta, filtra y gestiona todos tus movimientos financieros
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filteredTransactions, categories)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewTxModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
          >
            <span>+ Nueva Transacción</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por descripción o notas..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Selector */}
          <select
            value={filter.type}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, type: e.target.value as any }))
            }
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los Tipos</option>
            <option value="income">Solo Ingresos</option>
            <option value="expense">Solo Gastos</option>
          </select>

          {/* Category Selector */}
          <select
            value={filter.category_id}
            onChange={(e) => setFilter((prev) => ({ ...prev, category_id: e.target.value }))}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1 ${
              showAdvancedFilter
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 text-indigo-600 dark:text-indigo-400'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={resetFilter}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Limpiar filtros"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilter && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Desde Fecha
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Hasta Fecha
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Ordenar Por
              </label>
              <select
                value={filter.sortBy}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))
                }
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="date_desc">Fecha (Más reciente)</option>
                <option value="date_asc">Fecha (Más antigua)</option>
                <option value="amount_desc">Monto (Mayor a menor)</option>
                <option value="amount_asc">Monto (Menor a mayor)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <span>Resultados: {filteredTransactions.length} transacciones</span>
        <div className="flex items-center gap-4">
          <span className="text-emerald-600 dark:text-emerald-400">
            Ingresos: {formatCurrency(filteredIncome, currency)}
          </span>
          <span className="text-rose-600 dark:text-rose-400">
            Gastos: {formatCurrency(filteredExpenses, currency)}
          </span>
        </div>
      </div>

      {/* Transaction Items */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            No se encontraron transacciones
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Prueba ajustando los filtros de búsqueda o agrega un nuevo movimiento.
          </p>
          <button
            onClick={resetFilter}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const category = categoryMap.get(tx.category_id) || {
              id: tx.category_id,
              name: 'Sin categoría',
              icon: 'MoreHorizontal',
              color: '#94a3b8',
              type: 'expense' as const,
            };
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: `${category.color}18`, color: category.color }}
                  >
                    <IconHelper name={category.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {tx.description}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span className="font-semibold" style={{ color: category.color }}>
                        {category.name}
                      </span>
                      <span>•</span>
                      <span>{formatDate(tx.transaction_date, 'd MMMM, yyyy')}</span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate italic text-slate-400 max-w-[200px]">
                            "{tx.notes}"
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`text-base font-extrabold flex items-center gap-1 ${
                      isIncome
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-slate-400" />
                    )}
                    {isIncome ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditTransaction(tx)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(tx.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteTransaction(deleteId);
        }}
        title="¿Eliminar transacción?"
        description="Esta acción eliminará el registro permanentemente."
      />
    </div>
  );
};
