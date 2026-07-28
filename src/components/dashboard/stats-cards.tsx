"use client";

import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Wallet, PieChart } from "lucide-react";

interface StatsCardsProps {
  balance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  expensePercentage: number;
  prevIncome: number;
  prevExpense: number;
  loading?: boolean;
}

function StatCard({
  title, value, icon: Icon, trend, trendLabel, color, delay,
}: {
  title: string;
  value: string;
  icon: any;
  trend?: number;
  trendLabel?: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className={`p-2 rounded-full ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {trend >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={`text-xs ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {Math.abs(trend)}% {trendLabel}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function StatsCards({
  balance, monthlyIncome, monthlyExpense, expensePercentage,
  prevIncome, prevExpense, loading,
}: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1,2,3,4].map((i) => <StatSkeleton key={i} />)}
      </div>
    );
  }

  const incomeDiff = prevIncome > 0 ? Math.round(((monthlyIncome - prevIncome) / prevIncome) * 100) : 0;
  const expenseDiff = prevExpense > 0 ? Math.round(((monthlyExpense - prevExpense) / prevExpense) * 100) : 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Available Balance"
        value={formatCurrency(balance)}
        icon={Wallet}
        color="bg-blue-500"
        delay={0}
      />
      <StatCard
        title="Monthly Income"
        value={formatCurrency(monthlyIncome)}
        icon={TrendingUp}
        trend={incomeDiff}
        trendLabel="vs last month"
        color="bg-green-500"
        delay={0.1}
      />
      <StatCard
        title="Monthly Expenses"
        value={formatCurrency(monthlyExpense)}
        icon={TrendingDown}
        trend={expenseDiff}
        trendLabel="vs last month"
        color="bg-red-500"
        delay={0.2}
      />
      <StatCard
        title="Expense Rate"
        value={`${expensePercentage}%`}
        icon={PieChart}
        color="bg-purple-500"
        delay={0.3}
      />
    </div>
  );
}
