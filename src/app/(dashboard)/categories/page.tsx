"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { useCategories } from "@/hooks/use-categories";
import { CategoryForm } from "@/components/categories/category-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import type { Category } from "@/types";
import type { CategoryFormData } from "@/lib/validations";
import * as LucideIcons from "lucide-react";

const iconMap: Record<string, any> = LucideIcons;

export default function CategoriesPage() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useCategories();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async (data: CategoryFormData) => {
    setSubmitting(true);
    const payload = { ...data };

    let result;
    if (editingCat) {
      result = await updateCategory(editingCat.id, payload);
      if (!result.error) toast.success("Category updated");
    } else {
      result = await addCategory(payload);
      if (!result.error) toast.success("Category created");
    }
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    setFormOpen(false);
    setEditingCat(null);
  }, [editingCat, addCategory, updateCategory]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await deleteCategory(deleteId);
    if (error) toast.error(error);
    else toast.success("Category deleted");
    setDeleteId(null);
  };

  const renderIcon = (iconName: string, color: string) => {
    const IconComp = iconMap[iconName as keyof typeof iconMap] || iconMap.Circle;
    return <IconComp className="h-5 w-5" style={{ color }} />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">Organize your transactions by category</p>
        </div>
        <Button onClick={() => { setEditingCat(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add category
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="group hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  {renderIcon(cat.icon, cat.color)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                </div>
                {!cat.is_default && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCat(cat); setFormOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(cat.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {cat.is_default && (
                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">default</span>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <CategoryForm
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditingCat(null); }}
        onSubmit={handleSubmit}
        category={editingCat}
        loading={submitting}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This category may be linked to existing transactions. Are you sure?
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
