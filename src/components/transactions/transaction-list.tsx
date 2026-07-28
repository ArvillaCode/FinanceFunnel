"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import type { Transaction, Category } from "@/types";

interface TransactionListProps {
  transactions: (Transaction & { categories?: Category })[];
  loading: boolean;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionList({ transactions, loading, onEdit, onDelete }: TransactionListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1,2,3,4,5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ArrowRightLeft className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No transactions found</p>
        <p className="text-sm">Try adjusting your filters or add a new transaction.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        <AnimatePresence>
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: tx.categories?.color || "#6b7280" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.description || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.categories?.name} &middot; {formatDate(tx.transaction_date)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <Badge variant={tx.type === "income" ? "default" : "destructive"}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </Badge>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(tx)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(tx.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The transaction will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteId) await onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
