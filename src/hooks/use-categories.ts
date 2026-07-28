"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
  addCategory: (data: Partial<Category>) => Promise<{ error: string | null }>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<{ error: string | null }>;
  deleteCategory: (id: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
  getExpenseCategories: () => Category[];
  getIncomeCategories: () => Category[];
}

export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setCategories(data as Category[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (data: Partial<Category>) => {
    const { error } = await supabase.from("categories").insert(data);
    if (!error) await fetchCategories();
    return { error: error?.message || null };
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    const { error } = await supabase.from("categories").update(data).eq("id", id);
    if (!error) await fetchCategories();
    return { error: error?.message || null };
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) await fetchCategories();
    return { error: error?.message || null };
  };

  const getExpenseCategories = () =>
    categories.filter((c) => c.type === "expense" || c.type === "both");

  const getIncomeCategories = () =>
    categories.filter((c) => c.type === "income" || c.type === "both");

  return {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: fetchCategories,
    getExpenseCategories,
    getIncomeCategories,
  };
}
