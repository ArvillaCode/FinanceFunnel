"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { useBudgets } from "@/hooks/use-budgets";
import { useCategories } from "@/hooks/use-categories";
import { BudgetForm } from "@/components/budgets/budget-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Wallet, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentMonth, getCurrentYear, formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import type { Budget, Category } from "@/types";
import type { BudgetFormData } from "@/lib/validations";

export default function BudgetsPage() {
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const { budgets, loading, addBudget, updateBudget, deleteBudget } = useBudgets(month, year);
  const { categories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<(Budget & { categories?: Category }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();

  // Calculate spent per category
  const [spentMap, setSpentMap] = useState<Record<string, number>>({});

  const fetchSpent = useCallback(async () => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    if (data) {
      const map: Record<string, number> = {};
      data.forEach((t) => {
        map[t.category_id] = (map[t.category_id] || 0) + Number(t.amount);
      });
      setSpentMap(map);
    }
  }, [supabase, user, month, year]);

  const fetchAllSpent = useCallback(async () => {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = new Date(year, month, 0).toISOString().split("T")[0];

    const { data } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", user?.id)
      .eq("type", "expense")
      .gte("transaction_date", startDate)
      .lte("transaction_date", endDate);

    if (data) {
      return data.reduce((sum, t) => sum + Number(t.amount), 0);
    }
    return 0;
  }, [supabase, user, month, year]);

  const [totalSpent, setTotalSpent] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);

  useEffect(() => {
    if (!loading) {
      fetchSpent();
      fetchAllSpent().then(setTotalSpent);
      setTotalBudget(budgets.reduce((s, b) => s + Number(b.amount), 0));
    }
  }, [loading, budgets, fetchSpent, fetchAllSpent]);

  const handleSubmit = useCallback(async (data: BudgetFormData) => {
    setSubmitting(true);
    const payload = {
      ...data,
      month,
      year,
    };

    let result;
    if (editingBudget) {
      result = await updateBudget(editingBudget.id, payload);
      if (!result.error) toast.success("Budget updated");
    } else {
      result = await addBudget(payload);
      if (!result.error) toast.success("Budget created");
    }
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    setFormOpen(false);
    setEditingBudget(null);
  }, [editingBudget, month, year, addBudget, updateBudget]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await deleteBudget(deleteId);
    if (error) toast.error(error);
    else toast.success("Budget deleted");
    setDeleteId(null);
  };

  const getSpent = (budget: Budget & { categories?: Category }) => {
    if (!budget.category_id) return totalSpent;
    return spentMap[budget.category_id] || 0;
  };

  const getPercentage = (budget: Budget & { categories?: Category }) => {
    const spent = getSpent(budget);
    return Math.round((spent / Number(budget.amount)) * 100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">Set and track your monthly spending limits</p>
        </div>
        <Button onClick={() => { setEditingBudget(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add budget
        </Button>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-2">
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={month}
          onChange={(e) => setMonth(parseInt(e.target.value))}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {new Date(2000, m - 1).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Overall budget */}
      {totalBudget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Overall Monthly Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{formatCurrency(totalSpent)} spent</span>
                <span className="text-muted-foreground">of {formatCurrency(totalBudget)}</span>
              </div>
              <Progress value={Math.min((totalSpent / totalBudget) * 100, 100)} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round((totalSpent / totalBudget) * 100)}% used</span>
                <span>{formatCurrency(totalBudget - totalSpent)} remaining</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual budgets */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No budgets set</p>
          <p className="text-sm">Create a budget to start tracking your spending limits.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const spent = getSpent(budget);
            const percentage = getPercentage(budget);
            const cat = budget.categories;
            const isOver = spent > Number(budget.amount);
            const isWarning = percentage >= 80 && !isOver;

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className={cn(
                  "group hover:shadow-md transition-shadow",
                  isOver && "border-destructive",
                  isWarning && "border-amber-500"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {cat ? (
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        ) : (
                          <Wallet className="h-3 w-3" />
                        )}
                        <span className="font-medium text-sm">
                          {cat?.name || "General"}
                        </span>
                        {isOver && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Exceeded
                          </Badge>
                        )}
                        {isWarning && !isOver && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-500 text-amber-600">
                            {percentage}% used
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => { setEditingBudget(budget); setFormOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteId(budget.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{formatCurrency(spent)} spent</span>
                        <span className="text-muted-foreground">of {formatCurrency(Number(budget.amount))}</span>
                      </div>
                      <Progress
                        value={Math.min(percentage, 100)}
                        className={cn(
                          isOver && "bg-red-100 [&>div]:bg-destructive",
                          isWarning && !isOver && "bg-amber-100 [&>div]:bg-amber-500"
                        )}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{percentage}% used</span>
                        <span>{formatCurrency(Number(budget.amount) - spent)} remaining</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <BudgetForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingBudget(null); }}
        onSubmit={handleSubmit}
        budget={editingBudget}
        categories={categories}
        loading={submitting}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the budget limit. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
