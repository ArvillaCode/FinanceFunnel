import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import {
  Wallet,
  User,
  ChevronDown,
  LogOut,
  Calendar,
  KeyRound,
  Search,
  Users,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import { format, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface NavbarProps {
  onOpenAuthModal: () => void;
  onOpenNewTxModal: () => void;
  onOpenCommandModal: () => void;
  onNavigate: (view: string) => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuthModal,
  onOpenNewTxModal,
  onOpenCommandModal,
  onNavigate,
}) => {
  const { user, signOut, isDemoUser } = useAuth();
  const { selectedMonth, selectedYear, setSelectedPeriod } = useFinance();

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

  const isRealSuperAdmin = user?.role === 'superadmin' && !isDemoUser;

  return (
    <header className="sticky top-0 z-40 bg-[#080C14] border-b border-[#94A3B8]/20 transition-colors w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 relative">
        {/* Left: Brand & Workspace Switcher */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] uf-glow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="hidden lg:block">
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

          {/* Multi-Tenant Workspace Selector */}
          {user && <OrganizationSwitcher />}
        </div>

        {/* Center: Month Navigator & Command Search */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-[#080C14] rounded-xl p-1 border border-[#94A3B8]/30">
            <button
              onClick={handlePrevMonth}
              className="p-1 sm:p-1.5 rounded-lg text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#94A3B8]/10 transition-colors font-bold text-sm"
              title="Mes anterior"
            >
              ‹
            </button>
            <div className="px-2 sm:px-3 flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#FFFFFF] capitalize min-w-[85px] sm:min-w-[110px] justify-center">
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

          {/* Quick Command Palette Launcher */}
          <button
            onClick={onOpenCommandModal}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080C14] border border-[#94A3B8]/30 text-xs text-[#94A3B8] hover:text-[#FFFFFF] hover:border-[#00E5FF] transition-all"
            title="Buscar comandos (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Buscar (Ctrl + K)</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* New Tx Button */}
          <button
            onClick={onOpenNewTxModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95 uf-glow-sm"
          >
            <span className="text-base font-extrabold leading-none">+</span>
            <span className="hidden sm:inline">Nueva Transacción</span>
          </button>

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

            {/* Profile Dropdown */}
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
                        isRealSuperAdmin ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40' : 'bg-[#94A3B8]/10 text-[#94A3B8]'
                      }`}>
                        {isRealSuperAdmin ? 'SUPERADMIN' : isDemoUser ? 'MODO DEMO' : 'USUARIO'}
                      </span>
                    </div>
                  </div>
                </div>

                {isRealSuperAdmin && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigate('superadmin');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/10 rounded-xl transition-colors mb-1"
                  >
                    <KeyRound className="w-4 h-4 text-[#00E5FF]" />
                    <span>Panel de Licencias (SuperAdmin)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('team');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] rounded-xl transition-colors"
                >
                  <Users className="w-4 h-4 text-[#00E5FF]" />
                  <span>Equipo y Colaboradores</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('billing');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] rounded-xl transition-colors"
                >
                  <CreditCard className="w-4 h-4 text-[#00E5FF]" />
                  <span>Suscripción y Planes</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('datacenter');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] rounded-xl transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#00E5FF]" />
                  <span>Exportar / Importar Datos</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#FFFFFF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] rounded-xl transition-colors"
                >
                  <User className="w-4 h-4 text-[#00E5FF]" />
                  <span>Perfil y Configuración</span>
                </button>

                <div className="border-t border-[#94A3B8]/15 my-1" />

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
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
