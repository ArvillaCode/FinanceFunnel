import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  category_id: z.string().uuid("Category is required"),
  transaction_date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
  type: z.enum(["income", "expense", "both"]),
});

export const budgetSchema = z.object({
  category_id: z.string().uuid("Category is required").nullable(),
  amount: z.coerce.number().positive("Amount must be positive"),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
});

export const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  currency: z.string().min(1, "Currency is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type BudgetFormData = z.infer<typeof budgetSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
