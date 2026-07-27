import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import { useFinance } from '../../context/FinanceContext';

interface MetricCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  trend?: {
    percentage: number;
    isPositive: boolean;
    label: string;
  };
  accentColor?: string;
  subtitle?: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  icon: Icon,
  trend,
  subtitle,
  delay = 0,
}) => {
  const { currency } = useFinance();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="p-5 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm hover:border-[#00E5FF]/40 transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2.5 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 text-[#00E5FF] uf-glow-sm">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-extrabold text-[#FFFFFF] tracking-tight">
          {formatCurrency(amount, currency)}
        </h3>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-2.5 border-t border-[#94A3B8]/15 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1 font-medium">
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border text-[11px] font-bold ${
                  trend.isPositive
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/30 text-[#00E5FF]'
                    : 'bg-[#94A3B8]/10 border-[#94A3B8]/30 text-[#FFFFFF]'
                }`}
              >
                {trend.isPositive ? <TrendingUp className="w-3 h-3 text-[#00E5FF]" /> : <TrendingDown className="w-3 h-3 text-[#94A3B8]" />}
                {trend.percentage > 0 ? `+${trend.percentage.toFixed(1)}%` : `${trend.percentage.toFixed(1)}%`}
              </span>
              <span className="text-[#94A3B8] text-[11px] ml-1">{trend.label}</span>
            </div>
          ) : (
            <span className="text-[#94A3B8] font-medium">{subtitle}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};
