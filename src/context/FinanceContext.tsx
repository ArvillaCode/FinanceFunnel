import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Transaction, Category, Budget, CurrencyCode, TransactionFilter } from '../types';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import { getCurrentYearMonth } from '../lib/utils';
import { useAuth } from './AuthContext';
import { supabaseService } from '../lib/supabaseService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { tenantService } from '../lib/tenantService';
import { persistenceService } from '../lib/persistenceService';
import { generateSeedData } from '../lib/demoData';

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
  
  // Multi-Tenant Workspace
  currentOrgId: string;
  setCurrentOrgId: (orgId: string) => void;
  
  // Transaction CRUD
  addTransaction: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => void;
  addBulkTransactions: (dataList: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]) => Promise<number>;
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

  // Multi-Tenant Org State
  const [currentOrgId, setCurrentOrgIdState] = useState<string>(() => {
    return tenantService.getCurrentOrgId();
  });

  const setCurrentOrgId = (orgId: string) => {
    setCurrentOrgIdState(orgId);
    tenantService.setCurrentOrgId(orgId);
  };

  // Theme (Dark / Light)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const htmlEl = document.documentElement;
    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      htmlEl.classList.remove('light');
    } else {
      htmlEl.classList.add('light');
      htmlEl.classList.remove('dark');
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

  // State: Transactions (Initial Seed if Empty)
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return generateSeedData().transactions;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('finance_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return DEFAULT_CATEGORIES;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('finance_budgets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return generateSeedData().budgets;
  });

  // Guardado continuo en IndexedDB + Respaldo en LocalStorage
  useEffect(() => {
    if (transactions.length > 0) {
      persistenceService.saveTransactions(transactions);
    }
  }, [transactions]);

  // Recuperación desde IndexedDB tras barridos de caché de navegador
  useEffect(() => {
    if (transactions.length === 0) {
      persistenceService.loadTransactions().then((recovered) => {
        if (recovered && recovered.length > 0) {
          setTransactions(recovered);
        }
      });
    }
  }, []);

  // Fetch initial data from Supabase + Auto Sync Local Storage to Remote
  const loadRemoteData = async (userId: string) => {
    setIsLoading(true);
    try {
      const [remoteTxs, remoteCats, remoteBudgets] = await Promise.all([
        supabaseService.getTransactions(userId),
        supabaseService.getCategories(userId),
        supabaseService.getBudgets(userId),
      ]);

      const savedLocal = localStorage.getItem('finance_transactions');
      let localTxs: Transaction[] = [];
      if (savedLocal) {
        try {
          localTxs = JSON.parse(savedLocal);
        } catch {}
      }

      // Auto Sync: Si hay transacciones locales en el PC y Supabase está vacío o tiene menos datos, sincronizarlos automáticamente
      if (localTxs.length > 0 && (!remoteTxs || remoteTxs.length < localTxs.length)) {
        try {
          const formattedTxs = localTxs.map((t) => ({
            ...t,
            organization_id: currentOrgId,
          }));
          const synced = await supabaseService.createBulkTransactions(userId, formattedTxs);
          if (synced && synced.length > 0) {
            setTransactions(synced);
            if (remoteCats && remoteCats.length > 0) setCategories(remoteCats);
            setBudgets(remoteBudgets || []);
            setIsLoading(false);
            return;
          }
        } catch (syncErr) {
          console.warn('Error al auto-sincronizar transacciones locales a Supabase:', syncErr);
        }
      }

      setTransactions(remoteTxs || localTxs || []);
      if (remoteCats && remoteCats.length > 0) setCategories(remoteCats);
      setBudgets(remoteBudgets || []);
    } catch (err) {
      console.error('Error al obtener datos de Supabase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load user data & Subscribe to Realtime Updates + Mobile Focus Reconnect!
  useEffect(() => {
    if (user && isSupabaseConfigured) {
      loadRemoteData(user.id);

      // Re-sync on window focus (vital for Mobile browser tab switching & screen unlocks!)
      const handleFocus = () => {
        supabaseService.getTransactions(user.id).then((txs) => setTransactions(txs || []));
      };
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') handleFocus();
      });

      // Regular polling fallback every 5 seconds for instant cross-device sync
      const pollInterval = setInterval(() => {
        supabaseService.getTransactions(user.id).then((txs) => {
          if (txs && txs.length !== transactions.length) {
            setTransactions(txs);
          }
        });
      }, 5000);

      if (supabase) {
        const channel = supabase
          .channel('finance_realtime_sync')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
            () => {
              supabaseService.getTransactions(user.id).then((txs) => setTransactions(txs || []));
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'categories' },
            () => {
              supabaseService.getCategories(user.id).then((cats) => {
                if (cats && cats.length > 0) setCategories(cats);
              });
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
            () => {
              supabaseService.getBudgets(user.id).then((b) => setBudgets(b || []));
            }
          )
          .subscribe();

        return () => {
          window.removeEventListener('focus', handleFocus);
          clearInterval(pollInterval);
          supabase.removeChannel(channel);
        };
      }

      return () => {
        window.removeEventListener('focus', handleFocus);
        clearInterval(pollInterval);
      };
    } else if (!user) {
      setTransactions([]);
      setBudgets([]);
    }
  }, [user?.id]);

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
    const txWithOrg = {
      ...data,
      organization_id: currentOrgId,
    };

    if (user && isSupabaseConfigured) {
      const created = await supabaseService.createTransaction(user.id, txWithOrg);
      if (created) {
        setTransactions((prev) => [created, ...prev.filter((t) => t.id !== created.id)]);
      }
    } else {
      const newTx: Transaction = {
        ...txWithOrg,
        id: `tx-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTransactions((prev) => [newTx, ...prev]);
    }

    addToast({
      type: 'success',
      title: 'Transacción creada',
      message: `${data.type === 'income' ? 'Ingreso' : 'Gasto'} registrado en el espacio activo.`,
    });
  };

  const addBulkTransactions = async (
    dataList: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>[]
  ): Promise<number> => {
    if (dataList.length === 0) return 0;

    const formattedList = dataList.map((data) => ({
      ...data,
      organization_id: currentOrgId,
    }));

    if (user && isSupabaseConfigured) {
      try {
        const createdTxs = await supabaseService.createBulkTransactions(user.id, formattedList);
        if (createdTxs && createdTxs.length > 0) {
          setTransactions((prev) => [...createdTxs, ...prev]);
        }
      } catch (err) {
        console.error('Falló inserción masiva en Supabase, guardando localmente:', err);
        const newLocalTxs: Transaction[] = formattedList.map((tx, idx) => ({
          ...tx,
          id: `tx-${Date.now()}-${idx}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setTransactions((prev) => [...newLocalTxs, ...prev]);
      }
    } else {
      const newLocalTxs: Transaction[] = formattedList.map((tx, idx) => ({
        ...tx,
        id: `tx-${Date.now()}-${idx}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      setTransactions((prev) => [...newLocalTxs, ...prev]);
    }

    addToast({
      type: 'success',
      title: 'Importación masiva completada',
      message: `Se agregaron ${dataList.length} transacciones a tu espacio de trabajo.`,
    });

    return dataList.length;
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
    if (user && isSupabaseConfigured) {
      const created = await supabaseService.createCategory(user.id, data);
      if (created) {
        setCategories((prev) => [...prev, created]);
      }
    } else {
      const newCat: Category = {
        ...data,
        id: `cat-${Date.now()}`,
      };
      setCategories((prev) => [...prev, newCat]);
    }

    addToast({
      type: 'success',
      title: 'Categoría creada',
    });
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));

    addToast({
      type: 'success',
      title: 'Categoría actualizada',
    });
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

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
        await supabaseService.upsertBudget(user.id, categoryId, amount, selectedMonth, selectedYear);
      }
    } else {
      const newBudget: Budget = {
        id: `b-${Date.now()}`,
        organization_id: currentOrgId,
        category_id: categoryId,
        amount,
        month: selectedMonth,
        year: selectedYear,
      };
      setBudgets((prev) => [...prev, newBudget]);
      if (user && isSupabaseConfigured) {
        await supabaseService.upsertBudget(user.id, categoryId, amount, selectedMonth, selectedYear);
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

  // Filtered transactions computation WITH FLEXIBLE WORKSPACE TENANT ISOLATION!
  const filteredTransactions = useMemo(() => {
    // Si la organización activa no tiene transacciones pero existen transacciones en general, flexibilizamos el filtro
    const hasOrgSpecificTxs = transactions.some((t) => t.organization_id === currentOrgId);

    return transactions.filter((t) => {
      // 1. Flexible Tenant Isolation: si 'all' o no hay transacciones en la org actual, mostramos las globales/disponibles
      if (currentOrgId && currentOrgId !== 'all' && hasOrgSpecificTxs) {
        if (t.organization_id && t.organization_id !== currentOrgId) {
          return false;
        }
      }

      if (filter.search) {
        const query = filter.search.toLowerCase();
        const descMatch = t.description.toLowerCase().includes(query);
        const notesMatch = t.notes?.toLowerCase().includes(query) || false;
        if (!descMatch && !notesMatch) return false;
      }

      if (filter.type !== 'all' && t.type !== filter.type) {
        return false;
      }

      if (filter.category_id !== 'all' && t.category_id !== filter.category_id) {
        return false;
      }

      if (filter.startDate && t.transaction_date < filter.startDate) {
        return false;
      }
      if (filter.endDate && t.transaction_date > filter.endDate) {
        return false;
      }

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
  }, [transactions, filter, currentOrgId]);

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
        currentOrgId,
        setCurrentOrgId,
        addTransaction,
        addBulkTransactions,
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
