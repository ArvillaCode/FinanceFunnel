"use client";

import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import type { Transaction, Category } from "@/types";

interface RecentTransactionsProps {
  transactions: (Transaction & { categories?: Category })[];
  loading?: boolean;
}

export function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Link href="/transactions" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: tx.categories?.color || "#6b7280" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.categories?.name} &middot; {formatDate(tx.transaction_date)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={tx.type === "income" ? "default" : "destructive"}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
