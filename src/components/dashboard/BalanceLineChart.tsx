import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { get6MonthsBalanceTrajectory, formatCurrency } from '../../lib/utils';

export const BalanceLineChart: React.FC = () => {
  const { transactions, currency } = useFinance();

  const data = get6MonthsBalanceTrajectory(transactions);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      return (
        <div className="p-3 bg-[#080C14] text-[#FFFFFF] border border-[#00E5FF]/40 rounded-xl shadow-xl text-xs space-y-1 uf-glow-sm">
          <p className="font-semibold text-[#94A3B8] capitalize">{label}</p>
          <p className="text-[#94A3B8]">Saldo Acumulado:</p>
          <p className="font-extrabold text-sm text-[#00E5FF]">{formatCurrency(val, currency)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-[#FFFFFF]">
          Evolución del Saldo
        </h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Trayectoria del patrimonio acumulado en los últimos 6 meses
        </p>
      </div>

      <div className="h-56 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="saldo"
              stroke="#00E5FF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#balanceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
