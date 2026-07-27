import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { getCategorySpending, formatCurrency } from '../../lib/utils';
import { IconHelper } from '../ui/IconHelper';
import { PieChart as PieIcon } from 'lucide-react';

export const ExpensePieChart: React.FC = () => {
  const { transactions, categories, selectedMonth, selectedYear, currency } = useFinance();

  const data = getCategorySpending(transactions, categories, selectedYear, selectedMonth);

  if (data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <PieIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Sin gastos en este período
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Registra una transacción de gasto para ver la distribución por categoría.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1 z-50">
          <p className="font-semibold flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            {item.category_name}
          </p>
          <p className="font-bold text-sm">{formatCurrency(item.amount, currency)}</p>
          <p className="text-slate-300 text-[11px]">{item.percentage.toFixed(1)}% del total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          Gastos por Categoría
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Distribución de gastos en el mes seleccionado
        </p>
      </div>

      <div className="h-52 my-3 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={80}
              paddingAngle={3}
              dataKey="amount"
              nameKey="category_name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Legend */}
      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
        {data.map((cat) => (
          <div
            key={cat.category_id}
            className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <div
                className="w-3 h-3 rounded-md shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <IconHelper name={cat.icon} className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {cat.category_name}
              </span>
            </div>
            <div className="text-right shrink-0">
              <span className="font-bold text-slate-900 dark:text-white">
                {formatCurrency(cat.amount, currency)}
              </span>
              <span className="text-slate-400 ml-1.5 font-medium text-[11px]">
                {cat.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
