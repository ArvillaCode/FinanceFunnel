import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Category, Budget, CurrencyCode, TransactionFilter } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import { generateSeedData } from '../lib/demoData';
import { getCurrentYearMonth, getMonthlyTotals } from '../lib/utils';
import { useAuth } from './AuthContext';

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

  // State: Transactions, Categories, Budgets
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    const seed = generateSeedData();
    return seed.transactions;
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
    const seed = generateSeedData();
    return seed.budgets;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finance_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('finance_budgets', JSON.stringify(budgets));
  }, [budgets]);

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

  // Transaction Actions
  const addTransaction = (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const newTransaction: Transaction = {
      ...data,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: user?.id || 'demo-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTransactions((prev) => [newTransaction, ...prev]);
    addToast({
      type: 'success',
      title: 'Transacción creada',
      message: `${data.type === 'income' ? 'Ingreso' : 'Gasto'} de $${data.amount} registrado con éxito.`,
    });
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data, updated_at: new Date().toISOString() } : t))
    );
    addToast({
      type: 'info',
      title: 'Transacción actualizada',
      message: 'Los cambios han sido guardados.',
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    addToast({
      type: 'warning',
      title: 'Transacción eliminada',
      message: 'La transacción fue eliminada correctamente.',
    });
  };

  // Category Actions
  const addCategory = (data: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...data,
      id: `cat-custom-${Date.now()}`,
      user_id: user?.id,
      is_default: false,
    };
    setCategories((prev) => [...prev, newCat]);
    addToast({
      type: 'success',
      title: 'Categoría agregada',
      message: `Categoría "${data.name}" creada.`,
    });
  };

  const updateCategory = (id: string, data: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
    addToast({
      type: 'info',
      title: 'Categoría actualizada',
    });
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    addToast({
      type: 'warning',
      title: 'Categoría eliminada',
    });
  };

  // Budget Actions
  const setCategoryBudget = (categoryId: string | null, amount: number) => {
    setBudgets((prev) => {
      const existingIndex = prev.findIndex(
        (b) => b.category_id === categoryId && b.month === selectedMonth && b.year === selectedYear
      );

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          amount,
          updated_at: new Date().toISOString(),
        };
        return copy;
      }

      return [
        ...prev,
        {
          id: `bgt-${Date.now()}`,
          user_id: user?.id,
          category_id: categoryId,
          amount,
          month: selectedMonth,
          year: selectedYear,
          created_at: new Date().toISOString(),
        },
      ];
    });

    addToast({
      type: 'success',
      title: 'Presupuesto actualizado',
      message: `Límite guardado correctamente.`,
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const resetDemoData = () => {
    const seed = generateSeedData();
    setTransactions(seed.transactions);
    setCategories(seed.categories);
    setBudgets(seed.budgets);
    addToast({
      type: 'info',
      title: 'Datos de prueba restablecidos',
      message: 'Se cargaron las transacciones de los últimos 6 meses.',
    });
  };

  // Filtered transactions selector
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Type filter
      if (filter.type !== 'all' && t.type !== filter.type) return false;

      // Category filter
      if (filter.category_id !== 'all' && t.category_id !== filter.category_id) return false;

      // Search
      if (filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        const descMatch = t.description?.toLowerCase().includes(q);
        const notesMatch = t.notes?.toLowerCase().includes(q);
        if (!descMatch && !notesMatch) return false;
      }

      // Date range
      if (filter.startDate && t.transaction_date < filter.startDate) return false;
      if (filter.endDate && t.transaction_date > filter.endDate) return false;

      // Amount range
      if (filter.minAmount && t.amount < Number(filter.minAmount)) return false;
      if (filter.maxAmount && t.amount > Number(filter.maxAmount)) return false;

      return true;
    }).sort((a, b) => {
      if (filter.sortBy === 'date_desc') return b.transaction_date.localeCompare(a.transaction_date);
      if (filter.sortBy === 'date_asc') return a.transaction_date.localeCompare(b.transaction_date);
      if (filter.sortBy === 'amount_desc') return b.amount - a.amount;
      if (filter.sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
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
