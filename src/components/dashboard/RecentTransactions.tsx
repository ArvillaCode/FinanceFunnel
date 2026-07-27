import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { IconHelper } from '../ui/IconHelper';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Trash2, Edit3 } from 'lucide-react';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Transaction, Category } from '../../types';

interface RecentTransactionsProps {
  onNavigateTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  onNavigateTransactions,
  onEditTransaction,
}) => {
  const { transactions, categories, deleteTransaction, currency } = useFinance();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  // Get last 6 transactions sorted by date
  const recent = [...transactions]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 6);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Últimas Transacciones
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Movimientos recientes en tu cuenta
            </p>
          </div>
          <button
            onClick={onNavigateTransactions}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No hay transacciones registradas aún.
          </div>
        ) : (
          <div className="space-y-3">
            {recent.map((tx) => {
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
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: `${category.color}18`, color: category.color }}
                    >
                      <IconHelper name={category.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="font-medium truncate">{category.name}</span>
                        <span>•</span>
                        <span>{formatDate(tx.transaction_date, 'd MMM')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-xs font-extrabold flex items-center justify-end gap-0.5 ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, currency)}
                      </span>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="hidden group-hover:flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(tx.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteTransaction(deleteId);
        }}
        title="¿Eliminar transacción?"
        description="Esta acción no se puede deshacer. Se descontará o reintegrará del saldo."
      />
    </div>
  );
};
