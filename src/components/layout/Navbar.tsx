import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../types';
import {
  Sun,
  Moon,
  Wallet,
  User,
  ChevronDown,
  LogOut,
  Database,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface NavbarProps {
  onOpenAuthModal: () => void;
  onOpenNewTxModal: () => void;
  onNavigate: (view: string) => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuthModal,
  onOpenNewTxModal,
  onNavigate,
}) => {
  const { user, signOut, isDemoUser } = useAuth();
  const {
    currency,
    setCurrency,
    theme,
    toggleTheme,
    selectedMonth,
    selectedYear,
    setSelectedPeriod,
  } = useFinance();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const currentDate = new Date(selectedYear, selectedMonth - 1, 1);
  const formattedMonthName = format(currentDate, 'MMMM yyyy', { locale: es });

  const handlePrevMonth = () => {
    const prev = subMonths(currentDate, 1);
    setSelectedPeriod(prev.getMonth() + 1, prev.getFullYear());
  };

  const handleNextMonth = () => {
    const next = addMonths(currentDate, 1);
    setSelectedPeriod(next.getMonth() + 1, next.getFullYear());
  };

  return (
    <header className="sticky top-0 z-30 bg-[#080C14]/90 backdrop-blur-md border-b border-[#94A3B8]/20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] uf-glow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold tracking-tight text-[#FFFFFF] leading-tight flex items-center gap-2">
              <span>FinanceFunnel</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-semibold tracking-wider uppercase">
                Upfunnel
              </span>
            </h1>
            <p className="text-[11px] font-medium text-[#94A3B8]">
              Gestor Financiero Inteligente
            </p>
          </div>
        </div>

        {/* Center: Month Navigator */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/50">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Mes anterior"
          >
            ‹
          </button>
          <div className="px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 capitalize min-w-[110px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span>{formattedMonthName}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            title="Mes siguiente"
          >
            ›
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* New Tx Button Desktop */}
          <button
            onClick={onOpenNewTxModal}
            className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] font-bold text-xs shadow-md shadow-[#00E5FF]/20 transition-all hover:scale-[1.02] active:scale-95 uf-glow-sm"
          >
            <span className="text-base font-extrabold leading-none">+</span>
            <span>Nueva Transacción</span>
          </button>

          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile / Auth */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                  {user.full_name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 transition-colors"
              >
                Iniciar Sesión
              </button>
            )}

            {/* Profile Dropdown */}
            {isProfileOpen && user && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700/60 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.full_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>{isDemoUser ? 'Modo Demo Activo' : 'Conectado a Supabase'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Perfil y Configuración</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-xl transition-colors"
                >
                  <Database className="w-4 h-4 text-slate-400" />
                  <span>Configurar Supabase</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-700/60 my-1" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
