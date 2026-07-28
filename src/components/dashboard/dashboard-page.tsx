"use client";

import { motion } from "motion/react";
import { useDashboard } from "@/hooks/use-dashboard";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/providers/auth-provider";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { MonthlyBarChart } from "@/components/dashboard/monthly-bar-chart";
import { BalanceLineChart } from "@/components/dashboard/balance-line-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function DashboardPage() {
  const { data, loading, error } = useDashboard();
  const { profile } = useAuth();

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error loading dashboard: {error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-muted-foreground">Here&apos;s your financial overview</p>
      </div>

      <StatsCards
        balance={data?.balance ?? 0}
        monthlyIncome={data?.monthlyIncome ?? 0}
        monthlyExpense={data?.monthlyExpense ?? 0}
        expensePercentage={data?.expensePercentage ?? 0}
        prevIncome={data?.previousMonthIncome ?? 0}
        prevExpense={data?.previousMonthExpense ?? 0}
        loading={loading}
      />

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <CategoryDonut data={data?.categoryBreakdown ?? []} loading={loading} />
        <MonthlyBarChart data={data?.monthlyData ?? []} loading={loading} />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceLineChart data={data?.balanceHistory ?? []} loading={loading} />
        </div>
        <RecentTransactions
          transactions={data?.recentTransactions ?? []}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top Category Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Spending Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : data?.topCategory ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: data.topCategory.color }}
                  />
                  <span className="font-medium">{data.topCategory.name}</span>
                </div>
                <span className="font-bold text-lg">
                  ${data.topCategory.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No expenses this month</p>
            )}
          </CardContent>
        </Card>

        {/* Budget usage card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Budget Usage
            </CardTitle>
            <Link href="/budgets" className="text-sm text-primary hover:underline flex items-center gap-1">
              Details <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : data?.budgetUsage.total ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${data.budgetUsage.used.toLocaleString("en-US", { minimumFractionDigits: 2 })} spent
                  </span>
                  <span className="text-muted-foreground">of ${data.budgetUsage.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <Progress value={Math.min(data.budgetUsage.percentage, 100)} />
                <p className="text-xs text-muted-foreground">
                  {data.budgetUsage.percentage}% of monthly budget used
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">No budget set</p>
                <Link href="/budgets" className="text-sm text-primary hover:underline">
                  Set budget
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}