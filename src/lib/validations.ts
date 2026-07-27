import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z
    .number()
    .positive('El monto debe ser mayor a 0'),
  type: z.enum(['income', 'expense']),
  description: z
    .string()
    .min(2, 'La descripción debe tener al menos 2 caracteres')
    .max(100, 'La descripción no puede exceder 100 caracteres'),
  category_id: z.string().min(1, 'Debes seleccionar una categoría'),
  transaction_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha inválida',
  }),
  notes: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, 'El nombre de la categoría debe tener al menos 2 caracteres'),
  icon: z.string().min(1, 'Selecciona un icono'),
  color: z.string().min(1, 'Selecciona un color'),
  type: z.enum(['income', 'expense', 'both']),
});

export const budgetSchema = z.object({
  amount: z
    .number()
    .positive('El límite del presupuesto debe ser mayor a 0'),
  category_id: z.string().nullable().optional(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
