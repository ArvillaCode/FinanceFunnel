"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Transaction, Category } from "@/types";

interface TransactionFilters {
  type?: "income" | "expense" | "";
  category_id?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
  sortBy?: string;
}

interface UseTransactionsReturn {
  transactions: (Transaction & { categories?: Category })[];
  loading: boolean;
  error: string | null;
  filters: TransactionFilters;
  setFilters: (filters: TransactionFilters) => void;
  addTransaction: (data: Partial<Transaction>) => Promise<{ error: string | null }>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<{ error: string | null }>;
  deleteTransaction: (id: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<(Transaction & { categories?: Category })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({ sortBy: "date-desc" });
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("transactions")
      .select("*, categories(*)")
      .order("transaction_date", { ascending: false });

    if (filters.type) query = query.eq("type", filters.type);
    if (filters.category_id) query = query.eq("category_id", filters.category_id);
    if (filters.search) query = query.ilike("description", `%${filters.search}%`);
    if (filters.dateFrom) query = query.gte("transaction_date", filters.dateFrom);
    if (filters.dateTo) query = query.lte("transaction_date", filters.dateTo);
    if (filters.minAmount) query = query.gte("amount", parseFloat(filters.minAmount));
    if (filters.maxAmount) query = query.lte("amount", parseFloat(filters.maxAmount));

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      let result = (data || []) as (Transaction & { categories?: Category })[];
      if (filters.sortBy === "amount-desc") result.sort((a, b) => b.amount - a.amount);
      if (filters.sortBy === "amount-asc") result.sort((a, b) => a.amount - b.amount);
      if (filters.sortBy === "date-asc") result.sort((a, b) => a.transaction_date.localeCompare(b.transaction_date));
      setTransactions(result);
    }
    setLoading(false);
  }, [filters, supabase]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = async (data: Partial<Transaction>) => {
    const { error } = await supabase.from("transactions").insert(data);
    if (!error) await fetchTransactions();
    return { error: error?.message || null };
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const { error } = await supabase.from("transactions").update(data).eq("id", id);
    if (!error) await fetchTransactions();
    return { error: error?.message || null };
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) await fetchTransactions();
    return { error: error?.message || null };
  };

  return {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
  };
}
