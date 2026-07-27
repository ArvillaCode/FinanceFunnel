import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../types';
import {
  Wallet,
  User,
  ChevronDown,
  LogOut,
  Calendar,
  ShieldCheck,
  KeyRound,
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
  activeView,
}) => {
  const { user, signOut } = useAuth();
  const {
    currency,
    setCurrency,
    selectedMonth,
    selectedYear,
    setSelectedPeriod,
  } = useFinance();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <header className="sticky top-0 z-40 bg-[#080C14] border-b border-[#94A3B8]/20 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Brand */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => onNavigate('dashboard')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] uf-glow-sm">
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
        <div className="flex items-center bg-[#080C14] rounded-xl p-1 border border-[#94A3B8]/30 shrink-0">
          <button
            onClick={handlePrevMonth}
            className="p-1 sm:p-1.5 rounded-lg text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#94A3B8]/10 transition-colors font-bold text-sm"
            title="Mes anterior"
          >
            ‹
          </button>
          <div className="px-2 sm:px-3 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#FFFFFF] capitalize min-w-[90px] sm:min-w-[110px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-[#00E5FF] hidden sm:inline" />
            <span>{formattedMonthName}</span>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-1 sm:p-1.5 rounded-lg text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#94A3B8]/10 transition-colors font-bold text-sm"
            title="Mes siguiente"
          >
            ›
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* SuperAdmin Access Button */}
          {user?.role === 'superadmin' && (
            <button
              onClick={() => onNavigate('superadmin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold uppercase transition-all ${
                activeView === 'superadmin'
                  ? 'bg-[#00E5FF] text-[#080C14] border-[#00E5FF] uf-glow-sm'
                  : 'bg-[#00E5FF]/10 border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF]/20'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden md:inline">PANEL SUPERADMIN</span>
            </button>
          )}

          {/* New Tx Button Desktop */}
          <button
            onClick={onOpenNewTxModal}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 uf-glow-sm"
          >
            <span className="text-base font-extrabold leading-none">+</span>
            <span>Nueva Transacción</span>
          </button>

          {/* Currency Switcher */}
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="text-xs font-bold bg-[#080C14] text-[#FFFFFF] border border-[#94A3B8]/30 rounded-xl px-2 py-1.5 focus:outline-none focus:border-[#00E5FF] cursor-pointer"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code} className="bg-[#080C14] text-[#FFFFFF]">
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>

          {/* User Profile / Avatar Button */}
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <button
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-[#94A3B8]/10 transition-colors border border-[#94A3B8]/30 bg-[#080C14]"
                title="Menú de Usuario"
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-xl object-cover border border-[#00E5FF]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-[#080C14] border border-[#00E5FF]/50 text-[#00E5FF] font-bold text-xs flex items-center justify-center">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#00E5FF]" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 rounded-xl bg-[#00E5FF] text-[#080C14] font-bold text-xs hover:bg-[#00E5FF]/90 transition-colors uf-glow-sm"
              >
                Iniciar Sesión
              </button>
            )}

            {/* Clean, High Z-Index Profile Dropdown */}
            {isProfileOpen && user && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 shadow-2xl p-2.5 z-50 uf-glow">
                <div className="px-3 py-2.5 border-b border-[#94A3B8]/20 mb-1 flex items-center gap-3 bg-[#080C14] rounded-xl">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-10 h-10 rounded-xl object-cover border border-[#00E5FF]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] font-bold text-xs flex items-center justify-center border border-[#00E5FF]/40">
                      {user.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-extrabold text-[#FFFFFF] truncate">
                      {user.full_name}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] truncate">
                      {user.email}
                    </p>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        user.role === 'superadmin' ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                      }`}>
                        {user.role === 'superadmin' ? 'SUPERADMIN' : 'USUARIO'}
                      </span>
                    </div>
                  </div>
                </div>

                {user.role === 'superadmin' && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('superadmin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-xl transition-colors mb-1"
                  >
                    <KeyRound className="w-4 h-4 text-[#00E5FF]" />
                    <span>Panel de Licencias (SuperAdmin)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-[#FFFFFF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-[#00E5FF]" />
                  <span>Perfil, Avatar y Configuración</span>
                </button>

                <div className="border-t border-[#94A3B8]/15 my-1" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
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
