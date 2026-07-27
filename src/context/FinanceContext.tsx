import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, Category, Budget, CurrencyCode, TransactionFilter } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import { getCurrentYearMonth } from '../lib/utils';
import { useAuth } from './AuthContext';
import { supabaseService } from '../lib/supabaseService';
import { isSupabaseConfigured } from '../lib/supabase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currency: CurrencyCode;
  setCurrency: (curr: CurrencyCode) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  filter: TransactionFilter;
  setFilter: React.Dispatch<React.SetStateAction<TransactionFilter>>;
  resetFilter: () => void;
  selectedMonth: number;
  selectedYear: number;
  setSelectedPeriod: (month: number, year: number) => void;
  isLoading: boolean;
  
  // Transaction CRUD
  addTransaction: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Category CRUD
  addCategory: (data: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Budget CRUD
  setCategoryBudget: (categoryId: string | null, amount: number) => void;
  deleteBudget: (id: string) => void;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;

  // Actions
  resetDemoData: () => void;
  filteredTransactions: Transaction[];
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const INITIAL_FILTER: TransactionFilter = {
  search: '',
  type: 'all',
  category_id: 'all',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
  sortBy: 'date_desc',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentYM = getCurrentYearMonth();

  const [selectedMonth, setSelectedMonth] = useState<number>(currentYM.month);
  const [selectedYear, setSelectedYear] = useState<number>(currentYM.year);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Currency
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    return user?.currency || 'USD';
  });

  const setCurrency = (curr: CurrencyCode) => {
    setCurrencyState(curr);
  };

  // State: Transactions (Clean state default: empty)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('finance_categories');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_CATEGORIES;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('finance_budgets');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [];
  });

  // Load user data from Supabase when authenticated
  useEffect(() => {
    if (user && isSupabaseConfigured) {
      setIsLoading(true);
      Promise.all([
        supabaseService.getTransactions(user.id),
        supabaseService.getCategories(user.id),
        supabaseService.getBudgets(user.id),
      ])
        .then(([remoteTxs, remoteCats, remoteBudgets]) => {
          setTransactions(remoteTxs || []);
          if (remoteCats && remoteCats.length > 0) setCategories(remoteCats);
          setBudgets(remoteBudgets || []);
        })
        .catch((err) => {
          console.error('Error al sincronizar con Supabase:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (!user) {
      setTransactions([]);
      setBudgets([]);
    }
  }, [user?.id]);

  // Persist to local storage for guest/offline
  useEffect(() => {
    if (!user) {
      localStorage.setItem('finance_transactions', JSON.stringify(transactions));
    }
  }, [transactions, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('finance_categories', JSON.stringify(categories));
    }
  }, [categories, user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('finance_budgets', JSON.stringify(budgets));
    }
  }, [budgets, user]);

  // Filter state
  const [filter, setFilter] = useState<TransactionFilter>(INITIAL_FILTER);

  const resetFilter = () => setFilter(INITIAL_FILTER);

  const setSelectedPeriod = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Transaction CRUD
  const addTransaction = async (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const newTx: Transaction = {
      ...data,
      id: `tx-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);

    if (user && isSupabaseConfigured) {
      await supabaseService.addTransaction(user.id, data);
    }

    addToast({
      type: 'success',
      title: 'Transacción creada',
      message: `${data.type === 'income' ? 'Ingreso' : 'Gasto'} registrado correctamente.`,
    });
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t))
    );

    if (user && isSupabaseConfigured) {
      await supabaseService.updateTransaction(id, data);
    }

    addToast({
      type: 'success',
      title: 'Transacción actualizada',
    });
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (user && isSupabaseConfigured) {
      await supabaseService.deleteTransaction(id);
    }

    addToast({
      type: 'info',
      title: 'Transacción eliminada',
    });
  };

  // Category CRUD
  const addCategory = async (data: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...data,
      id: `cat-${Date.now()}`,
    };

    setCategories((prev) => [...prev, newCat]);

    if (user && isSupabaseConfigured) {
      await supabaseService.addCategory(user.id, data);
    }

    addToast({
      type: 'success',
      title: 'Categoría creada',
    });
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

    if (user && isSupabaseConfigured) {
      await supabaseService.updateCategory(id, data);
    }

    addToast({
      type: 'success',
      title: 'Categoría actualizada',
    });
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (user && isSupabaseConfigured) {
      await supabaseService.deleteCategory(id);
    }

    addToast({
      type: 'info',
      title: 'Categoría eliminada',
    });
  };

  // Budget CRUD
  const setCategoryBudget = async (categoryId: string | null, amount: number) => {
    const existing = budgets.find(
      (b) => b.category_id === categoryId && b.month === selectedMonth && b.year === selectedYear
    );

    if (existing) {
      setBudgets((prev) =>
        prev.map((b) => (b.id === existing.id ? { ...b, amount } : b))
      );
      if (user && isSupabaseConfigured) {
        await supabaseService.setBudget(user.id, categoryId, amount, selectedMonth, selectedYear);
      }
    } else {
      const newBudget: Budget = {
        id: `b-${Date.now()}`,
        category_id: categoryId,
        amount,
        month: selectedMonth,
        year: selectedYear,
      };
      setBudgets((prev) => [...prev, newBudget]);
      if (user && isSupabaseConfigured) {
        await supabaseService.setBudget(user.id, categoryId, amount, selectedMonth, selectedYear);
      }
    }

    addToast({
      type: 'success',
      title: 'Presupuesto guardado',
    });
  };

  const deleteBudget = async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    addToast({
      type: 'info',
      title: 'Presupuesto eliminado',
    });
  };

  // Reset/Clear data
  const resetDemoData = () => {
    setTransactions([]);
    setBudgets([]);
    localStorage.removeItem('finance_transactions');
    localStorage.removeItem('finance_budgets');
    addToast({
      type: 'info',
      title: 'Plataforma limpia',
      message: 'Se han eliminado todos los datos. La aplicación está como nueva.',
    });
  };

  // Filtered transactions computation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      if (filter.search) {
        const query = filter.search.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(query);
        const notesMatch = t.notes?.toLowerCase().includes(query) || false;
        if (!descMatch && !notesMatch) return false;
      }

      // Type
      if (filter.type !== 'all' && t.type !== filter.type) {
        return false;
      }

      // Category
      if (filter.category_id !== 'all' && t.category_id !== filter.category_id) {
        return false;
      }

      // Date range
      if (filter.startDate && t.transaction_date < filter.startDate) {
        return false;
      }
      if (filter.endDate && t.transaction_date > filter.endDate) {
        return false;
      }

      // Amount range
      if (filter.minAmount && t.amount < parseFloat(filter.minAmount)) {
        return false;
      }
      if (filter.maxAmount && t.amount > parseFloat(filter.maxAmount)) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (filter.sortBy) {
        case 'date_asc':
          return a.transaction_date.localeCompare(b.transaction_date);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        case 'date_desc':
        default:
          return b.transaction_date.localeCompare(a.transaction_date);
      }
    });
  }, [transactions, filter]);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        currency,
        setCurrency,
        theme,
        toggleTheme,
        filter,
        setFilter,
        resetFilter,
        selectedMonth,
        selectedYear,
        setSelectedPeriod,
        isLoading,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        setCategoryBudget,
        deleteBudget,
        toasts,
        addToast,
        removeToast,
        resetDemoData,
        filteredTransactions,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
