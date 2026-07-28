"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardData, Transaction, Category, MonthlySummary } from "@/types";
import { getCurrentMonth, getCurrentYear } from "@/lib/utils";

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentMonth = getCurrentMonth();
      const currentYear = getCurrentYear();

      // Get previous month
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Fetch all transactions for the last 6 months
      const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1).toISOString().split("T")[0];

      const { data: transactions, error: txError } = await supabase
        .from("transactions")
        .select("*, categories(*)")
        .gte("transaction_date", sixMonthsAgo)
        .order("transaction_date", { ascending: false });

      if (txError) throw new Error(txError.message);

      const txList = (transactions || []) as (Transaction & { categories?: Category })[];

      // Current month transactions
      const currentMonthTx = txList.filter((t) => {
        const d = new Date(t.transaction_date);
        return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
      });

      const monthlyIncome = currentMonthTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const monthlyExpense = currentMonthTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Previous month
      const prevMonthTx = txList.filter((t) => {
        const d = new Date(t.transaction_date);
        return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
      });

      const previousMonthIncome = prevMonthTx
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const previousMonthExpense = prevMonthTx
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Balance (all time)
      const allIncome = txList
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const allExpense = txList
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const balance = allIncome - allExpense;

      // Expense percentage
      const expensePercentage = monthlyIncome > 0
        ? Math.round((monthlyExpense / monthlyIncome) * 100)
        : monthlyExpense > 0 ? 100 : 0;

      // Category breakdown (current month expenses)
      const categoryMap = new Map<string, { amount: number; color: string; name: string }>();
      currentMonthTx
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          const catName = t.categories?.name || "Other";
          const catColor = t.categories?.color || "#6b7280";
          const existing = categoryMap.get(t.category_id) || { amount: 0, color: catColor, name: catName };
          existing.amount += Number(t.amount);
          categoryMap.set(t.category_id, existing);
        });

      const totalExpenseAmount = Array.from(categoryMap.values()).reduce((s, c) => s + c.amount, 0);
      const categoryBreakdown = Array.from(categoryMap.entries()).map(([_, v]) => ({
        category: v.name,
        amount: v.amount,
        color: v.color,
        percentage: totalExpenseAmount > 0 ? Math.round((v.amount / totalExpenseAmount) * 100) : 0,
      })).sort((a, b) => b.amount - a.amount);

      // Top category
      const topCategory = categoryBreakdown.length > 0
        ? { name: categoryBreakdown[0].category, amount: categoryBreakdown[0].amount, color: categoryBreakdown[0].color }
        : null;

      // Recent transactions (last 5)
      const recentTransactions = txList.slice(0, 5);

      // Monthly data for bar chart (last 6 months)
      const monthlyData: MonthlySummary[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const monthTx = txList.filter((t) => {
          const td = new Date(t.transaction_date);
          return td.getMonth() + 1 === m && td.getFullYear() === y;
        });
        const inc = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const exp = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        monthlyData.push({ month: m, year: y, income: inc, expense: exp, balance: inc - exp });
      }

      // Balance history (last 6 months, cumulative)
      let runningBalance = 0;
      const balanceHistory = monthlyData.map((m) => {
        runningBalance += m.income - m.expense;
        return {
          month: `${getMonthName(m.month)} ${m.year}`,
          balance: runningBalance,
        };
      });

      // Budget usage
      const { data: budgets } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      const totalBudget = (budgets || []).reduce((s, b) => s + Number(b.amount), 0);
      const budgetUsage = {
        used: monthlyExpense,
        total: totalBudget,
        percentage: totalBudget > 0 ? Math.round((monthlyExpense / totalBudget) * 100) : 0,
      };

      setData({
        balance,
        monthlyIncome,
        monthlyExpense,
        expensePercentage,
        previousMonthIncome,
        previousMonthExpense,
        topCategory,
        recentTransactions,
        categoryBreakdown,
        monthlyData,
        balanceHistory,
        budgetUsage,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refresh: fetchDashboard };
}

function getMonthName(month: number): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[month - 1] || "";
}
