"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Budget, Category } from "@/types";

interface UseBudgetsReturn {
  budgets: (Budget & { categories?: Category })[];
  loading: boolean;
  error: string | null;
  addBudget: (data: Partial<Budget>) => Promise<{ error: string | null }>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<{ error: string | null }>;
  deleteBudget: (id: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

export function useBudgets(month?: number, year?: number): UseBudgetsReturn {
  const [budgets, setBudgets] = useState<(Budget & { categories?: Category })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const m = month || currentMonth;
  const y = year || currentYear;

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("budgets")
      .select("*, categories(*)")
      .eq("month", m)
      .eq("year", y);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setBudgets(data as (Budget & { categories?: Category })[]);
    }
    setLoading(false);
  }, [m, y, supabase]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const addBudget = async (data: Partial<Budget>) => {
    const { error } = await supabase.from("budgets").insert(data);
    if (!error) await fetchBudgets();
    return { error: error?.message || null };
  };

  const updateBudget = async (id: string, data: Partial<Budget>) => {
    const { error } = await supabase.from("budgets").update(data).eq("id", id);
    if (!error) await fetchBudgets();
    return { error: error?.message || null };
  };

  const deleteBudget = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (!error) await fetchBudgets();
    return { error: error?.message || null };
  };

  return {
    budgets,
    loading,
    error,
    addBudget,
    updateBudget,
    deleteBudget,
    refresh: fetchBudgets,
  };
}
