import { supabase } from './supabase';
import { Transaction, Category, Budget } from '../types';

export const supabaseService = {
  // --- TRANSACTIONS ---
  async getTransactions(userId: string): Promise<Transaction[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error al obtener transacciones de Supabase:', error.message);
      throw error;
    }
    return (data as Transaction[]) || [];
  },

  async createTransaction(userId: string, tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id: userId,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          category_id: tx.category_id,
          transaction_date: tx.transaction_date,
          notes: tx.notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear transacción en Supabase:', error.message);
      throw error;
    }
    return data as Transaction;
  },

  async updateTransaction(id: string, tx: Partial<Transaction>): Promise<Transaction | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...tx,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar transacción en Supabase:', error.message);
      throw error;
    }
    return data as Transaction;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar transacción en Supabase:', error.message);
      throw error;
    }
    return true;
  },

  // --- CATEGORIES ---
  async getCategories(userId: string): Promise<Category[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_default.eq.true,user_id.eq.${userId}`);

    if (error) {
      console.error('Error al obtener categorías de Supabase:', error.message);
      throw error;
    }
    return (data as Category[]) || [];
  },

  async createCategory(userId: string, cat: Omit<Category, 'id'>): Promise<Category | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          user_id: userId,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          is_default: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error al crear categoría en Supabase:', error.message);
      throw error;
    }
    return data as Category;
  },

  // --- BUDGETS ---
  async getBudgets(userId: string): Promise<Budget[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error al obtener presupuestos de Supabase:', error.message);
      throw error;
    }
    return (data as Budget[]) || [];
  },

  async upsertBudget(userId: string, categoryId: string | null, amount: number, month: number, year: number): Promise<Budget | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        [
          {
            user_id: userId,
            category_id: categoryId,
            amount,
            month,
            year,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: 'user_id,category_id,month,year' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error al guardar presupuesto en Supabase:', error.message);
      throw error;
    }
    return data as Budget;
  },
};
