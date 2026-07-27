import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, exportToCSV } from '../../lib/utils';
import { IconHelper } from '../ui/IconHelper';
import {
  Search,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Calculate totals for currently filtered list
  const filteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Pagination calculation
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
    (validPage - 1) * pageSize,
    validPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">
            Historial de Transacciones
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Consulta, filtra y gestiona todos tus movimientos financieros
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportToCSV(filteredTransactions, categories)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#080C14] border border-[#94A3B8]/30 hover:border-[#00E5FF] text-[#94A3B8] hover:text-[#FFFFFF] text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-[#00E5FF]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewTxModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-bold shadow-md shadow-[#00E5FF]/20 transition-all uf-glow-sm"
          >
            <span>+ Nueva Transacción</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Buscar por descripción o notas..."
              value={filter.search}
              onChange={(e) => setFilter((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* Type Selector */}
          <select
            value={filter.type}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, type: e.target.value as any }))
            }
            className="w-full sm:w-auto px-3 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
          >
            <option value="all" className="bg-[#080C14]">Todos los Tipos</option>
            <option value="income" className="bg-[#080C14]">Solo Ingresos</option>
            <option value="expense" className="bg-[#080C14]">Solo Gastos</option>
          </select>

          {/* Category Selector */}
          <select
            value={filter.category_id}
            onChange={(e) => setFilter((prev) => ({ ...prev, category_id: e.target.value }))}
            className="w-full sm:w-auto px-3 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
          >
            <option value="all" className="bg-[#080C14]">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#080C14]">
                {c.name}
              </option>
            ))}
          </select>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1 ${
              showAdvancedFilter
                ? 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF] uf-glow-sm'
                : 'bg-[#080C14] border-[#94A3B8]/30 text-[#94A3B8] hover:text-[#FFFFFF]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>

          {/* Reset Filters */}
          <button
            onClick={resetFilter}
            className="p-2 rounded-xl text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
            title="Limpiar filtros"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilter && (
          <div className="pt-3 border-t border-[#94A3B8]/15 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                Desde Fecha
              </label>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-1.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                Hasta Fecha
              </label>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-1.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                Ordenar Por
              </label>
              <select
                value={filter.sortBy}
                onChange={(e) =>
                  setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))
                }
                className="w-full px-3 py-1.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:border-[#00E5FF]"
              >
                <option value="date_desc" className="bg-[#080C14]">Fecha (Más reciente)</option>
                <option value="date_asc" className="bg-[#080C14]">Fecha (Más antigua)</option>
                <option value="amount_desc" className="bg-[#080C14]">Monto (Mayor a menor)</option>
                <option value="amount_asc" className="bg-[#080C14]">Monto (Menor a mayor)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Summary Bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#080C14] border border-[#94A3B8]/20 text-xs font-semibold text-[#94A3B8]">
        <span>Resultados: {filteredTransactions.length} transacciones</span>
        <div className="flex items-center gap-4">
          <span className="text-[#00E5FF] font-bold">
            Ingresos: {formatCurrency(filteredIncome, currency)}
          </span>
          <span className="text-[#FFFFFF] font-bold">
            Gastos: {formatCurrency(filteredExpenses, currency)}
          </span>
        </div>
      </div>

      {/* Transaction Items */}
      {filteredTransactions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#080C14] border border-[#94A3B8]/20">
          <p className="text-sm font-semibold text-[#FFFFFF]">
            No se encontraron transacciones
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            Prueba ajustando los filtros de búsqueda o agrega un nuevo movimiento.
          </p>
          <button
            onClick={resetFilter}
            className="mt-4 px-4 py-2 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-semibold hover:bg-[#00E5FF]/20 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {paginatedTransactions.map((tx) => {
              const category = categoryMap.get(tx.category_id) || {
                id: tx.category_id,
                name: 'Sin categoría',
                icon: 'MoreHorizontal',
                color: '#94A3B8',
                type: 'expense' as const,
              };
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-xs hover:border-[#00E5FF]/40 transition-all flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#080C14] border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center shrink-0 shadow-xs uf-glow-sm">
                      <IconHelper name={category.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[#FFFFFF] truncate">
                        {tx.description}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#94A3B8] mt-0.5">
                        <span className="font-semibold text-[#00E5FF]">
                          {category.name}
                        </span>
                        <span>•</span>
                        <span>{formatDate(tx.transaction_date, 'd MMMM, yyyy')}</span>
                        {tx.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate italic text-[#94A3B8]/70 max-w-[200px]">
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
                        isIncome ? 'text-[#00E5FF]' : 'text-[#FFFFFF]'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4 text-[#00E5FF]" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-[#94A3B8]" />
                      )}
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, currency)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(tx.id)}
                        className="p-2 rounded-xl text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#FFFFFF]/10 transition-colors"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                <span>
                  Mostrando { (validPage - 1) * pageSize + 1 } - { Math.min(validPage * pageSize, totalItems) } de { totalItems }
                </span>
                <span className="text-[#94A3B8]/40">|</span>
                <div className="flex items-center gap-1">
                  <span>Por página:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-[#080C14] text-[#FFFFFF] border border-[#94A3B8]/30 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00E5FF]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={validPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#94A3B8]/30 text-xs font-semibold text-[#FFFFFF] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00E5FF] hover:text-[#00E5FF] transition-all"
                >
                  ‹ Anterior
                </button>
                <span className="text-xs font-bold text-[#00E5FF] px-2">
                  {validPage} / {totalPages}
                </span>
                <button
                  disabled={validPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl border border-[#94A3B8]/30 text-xs font-semibold text-[#FFFFFF] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00E5FF] hover:text-[#00E5FF] transition-all"
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          )}
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
