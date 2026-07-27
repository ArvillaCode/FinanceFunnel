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
    isPositive: boolean; // whether positive direction is good (e.g. for income) or bad (for expenses)
    label: string;
  };
  accentColor?: string; // 'emerald' | 'rose' | 'indigo' | 'amber'
  subtitle?: string;
  delay?: number;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  amount,
  icon: Icon,
  trend,
  accentColor = 'indigo',
  subtitle,
  delay = 0,
}) => {
  const { currency } = useFinance();

  const getAccentStyles = () => {
    switch (accentColor) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-100 dark:border-emerald-900/40',
        };
      case 'rose':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-100 dark:border-rose-900/40',
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-100 dark:border-amber-900/40',
        };
      default:
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/40',
          text: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-100 dark:border-indigo-900/40',
        };
    }
  };

  const accent = getAccentStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="p-5 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl ${accent.bg} ${accent.text} ${accent.border} border`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {formatCurrency(amount, currency)}
        </h3>
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1 font-medium">
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                  trend.isPositive
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                }`}
              >
                {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend.percentage > 0 ? `+${trend.percentage.toFixed(1)}%` : `${trend.percentage.toFixed(1)}%`}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-[11px] ml-1">{trend.label}</span>
            </div>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 font-medium">{subtitle}</span>
          )}
        </div>
      )}
    </motion.div>
  );
};
