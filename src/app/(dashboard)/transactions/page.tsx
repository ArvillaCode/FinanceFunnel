"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionList } from "@/components/transactions/transaction-list";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Transaction } from "@/types";
import type { TransactionFormData } from "@/lib/validations";

export default function TransactionsPage() {
  const {
    transactions, loading, filters, setFilters,
    addTransaction, updateTransaction, deleteTransaction,
  } = useTransactions();
  const { categories } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (data: TransactionFormData) => {
    setSubmitting(true);
    const payload = {
      type: data.type,
      amount: data.amount,
      description: data.description,
      category_id: data.category_id,
      transaction_date: data.transaction_date,
      notes: data.notes || "",
    };

    let result;
    if (editingTx) {
      result = await updateTransaction(editingTx.id, payload);
      if (!result.error) toast.success("Transaction updated");
    } else {
      result = await addTransaction(payload);
      if (!result.error) toast.success("Transaction added");
    }
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    setFormOpen(false);
    setEditingTx(null);
  }, [editingTx, addTransaction, updateTransaction]);

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteTransaction(id);
    if (error) toast.error(error);
    else toast.success("Transaction deleted");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">Manage your income and expenses</p>
        </div>
        <Button onClick={() => { setEditingTx(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add transaction
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <TransactionFilters
            categories={categories}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </CardHeader>
        <CardContent>
          <TransactionList
            transactions={transactions}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <TransactionForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingTx(null); }}
        onSubmit={handleSubmit}
        transaction={editingTx}
        categories={categories}
        loading={submitting}
      />
    </motion.div>
  );
}
