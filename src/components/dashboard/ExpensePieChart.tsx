import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { getCategorySpending, formatCurrency } from '../../lib/utils';
import { IconHelper } from '../ui/IconHelper';
import { PieChart as PieIcon } from 'lucide-react';

const UPFUNNEL_PALETTE = ['#00E5FF', '#FFFFFF', '#94A3B8'];

export const ExpensePieChart: React.FC = () => {
  const { transactions, categories, selectedMonth, selectedYear, currency } = useFinance();

  const data = getCategorySpending(transactions, categories, selectedYear, selectedMonth);

  if (data.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex flex-col items-center justify-center min-h-[340px] text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#080C14] border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] mb-3 uf-glow-sm">
          <PieIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-[#FFFFFF]">
          Sin gastos en este período
        </p>
        <p className="text-xs text-[#94A3B8] mt-1">
          Registra una transacción de gasto para ver la distribución por categoría.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="p-3 bg-[#080C14] text-[#FFFFFF] border border-[#00E5FF]/40 rounded-xl shadow-xl text-xs space-y-1 z-50 uf-glow-sm">
          <p className="font-semibold flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            {item.category_name}
          </p>
          <p className="font-bold text-sm text-[#00E5FF]">{formatCurrency(item.amount, currency)}</p>
          <p className="text-[#94A3B8] text-[11px]">{item.percentage.toFixed(1)}% del total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-[#FFFFFF] flex items-center gap-2">
          Gastos por Categoría
        </h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
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
                <Cell
                  key={`cell-${index}`}
                  fill={UPFUNNEL_PALETTE[index % UPFUNNEL_PALETTE.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Category Legend */}
      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
        {data.map((cat, index) => {
          const color = UPFUNNEL_PALETTE[index % UPFUNNEL_PALETTE.length];
          return (
            <div
              key={cat.category_id}
              className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-[#94A3B8]/10 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <div
                  className="w-3 h-3 rounded-md shrink-0"
                  style={{ backgroundColor: color }}
                />
                <IconHelper name={cat.icon} className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                <span className="font-medium text-[#FFFFFF] truncate">
                  {cat.category_name}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold text-[#FFFFFF]">
                  {formatCurrency(cat.amount, currency)}
                </span>
                <span className="text-[#94A3B8] ml-1.5 font-medium text-[11px]">
                  {cat.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
