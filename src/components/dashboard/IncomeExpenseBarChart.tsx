import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { getLast6MonthsSummary, formatCurrency } from '../../lib/utils';

export const IncomeExpenseBarChart: React.FC = () => {
  const { transactions, currency } = useFinance();

  const data = getLast6MonthsSummary(transactions);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-[#080C14] text-[#FFFFFF] border border-[#00E5FF]/40 rounded-xl shadow-xl text-xs space-y-1.5 uf-glow-sm">
          <p className="font-bold text-[#94A3B8] capitalize">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[#00E5FF] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF]" /> Ingresos:
            </span>
            <span className="font-bold">{formatCurrency(payload[0]?.value || 0, currency)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-[#94A3B8] font-medium">
              <span className="w-2 h-2 rounded-full bg-[#94A3B8]" /> Gastos:
            </span>
            <span className="font-bold">{formatCurrency(payload[1]?.value || 0, currency)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-[#FFFFFF]">
          Ingresos vs Gastos Mensuales
        </h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Comparativa financiera durante los últimos 6 meses
        </p>
      </div>

      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94A3B8" opacity={0.15} />
            <XAxis
              dataKey="monthName"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 10 }}
              tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: 15, fontSize: 12 }}
              formatter={(value) => (
                <span className="text-xs font-semibold text-[#FFFFFF]">
                  {value === 'income' ? 'Ingresos' : 'Gastos'}
                </span>
              )}
            />
            <Bar
              dataKey="income"
              name="income"
              fill="#00E5FF"
              radius={[6, 6, 0, 0]}
              maxBarSize={30}
            />
            <Bar
              dataKey="expenses"
              name="expenses"
              fill="#94A3B8"
              radius={[6, 6, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
