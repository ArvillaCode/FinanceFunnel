"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryFormData } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { Category } from "@/types";

const ICONS = [
  { value: "home", label: "Home" },
  { value: "utensils-crossed", label: "Food" },
  { value: "car", label: "Car" },
  { value: "zap", label: "Services" },
  { value: "gamepad-2", label: "Entertainment" },
  { value: "heart-pulse", label: "Health" },
  { value: "graduation-cap", label: "Education" },
  { value: "landmark", label: "Bank" },
  { value: "shopping-bag", label: "Shopping" },
  { value: "briefcase", label: "Work" },
  { value: "laptop", label: "Freelance" },
  { value: "trending-up", label: "Investments" },
  { value: "gift", label: "Gift" },
  { value: "circle", label: "Other" },
];

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#ec4899",
  "#6b7280", "#84cc16", "#0ea5e9", "#6366f1",
];

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category | null;
  loading?: boolean;
}

export function CategoryForm({ open, onOpenChange, onSubmit, category, loading }: CategoryFormProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", icon: "circle", color: "#6b7280", type: "expense" },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
      });
    } else {
      form.reset({ name: "", icon: "circle", color: "#6b7280", type: "expense" });
    }
  }, [category, form]);

  const handleSubmit = async (data: CategoryFormData) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
          <DialogDescription>
            {category ? "Update the category details." : "Create a new custom category."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Category name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.watch("type")} onValueChange={(v: any) => form.setValue("type", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <Select value={form.watch("icon")} onValueChange={(v) => form.setValue("icon", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICONS.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>{icon.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.watch("color") === color ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => form.setValue("color", color)}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {category ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
