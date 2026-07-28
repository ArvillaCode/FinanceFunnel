import React, { useState, useEffect } from 'react';
import { Search, LayoutDashboard, ArrowRightLeft, PieChart, Tags, Settings, Users, CreditCard, PlusCircle, Moon, Sun, Bot, KeyRound, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';

interface QuickActionCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenNewTxModal: () => void;
}

export const QuickActionCommandModal: React.FC<QuickActionCommandModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenNewTxModal,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useFinance();
  const [search, setSearch] = useState('');

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const ACTIONS = [
    { id: 'new-tx', label: 'Agregar Nueva Transacción', icon: PlusCircle, action: () => { onOpenNewTxModal(); onClose(); } },
    { id: 'dashboard', label: 'Ir a Dashboard Financiero', icon: LayoutDashboard, action: () => { onNavigate('dashboard'); onClose(); } },
    { id: 'transactions', label: 'Ver Historial de Transacciones', icon: ArrowRightLeft, action: () => { onNavigate('transactions'); onClose(); } },
    { id: 'budgets', label: 'Gestionar Presupuestos', icon: PieChart, action: () => { onNavigate('budgets'); onClose(); } },
    { id: 'categories', label: 'Configurar Categorías', icon: Tags, action: () => { onNavigate('categories'); onClose(); } },
    { id: 'team', label: 'Gestión de Equipo Multi-Tenant', icon: Users, action: () => { onNavigate('team'); onClose(); } },
    { id: 'billing', label: 'Ver Planes y Suscripción SaaS', icon: CreditCard, action: () => { onNavigate('billing'); onClose(); } },
    { id: 'datacenter', label: 'Centro de Datos (Exportar / Importar CSV)', icon: ArrowRightLeft, action: () => { onNavigate('datacenter'); onClose(); } },
    { id: 'settings', label: 'Perfil y Configuración de IA Gemini', icon: Settings, action: () => { onNavigate('settings'); onClose(); } },
    { id: 'install-pwa', label: 'Instalar Aplicación Nativa PWA', icon: Smartphone, action: () => { window.dispatchEvent(new Event('open-pwa-banner')); onClose(); } },
    { id: 'toggle-theme', label: `Cambiar a Modo ${theme === 'dark' ? 'Claro' : 'Oscuro'}`, icon: theme === 'dark' ? Sun : Moon, action: () => { toggleTheme(); onClose(); } },
  ];

  if (user?.role === 'superadmin') {
    ACTIONS.unshift({ id: 'superadmin', label: 'Abrir Panel de Control SuperAdmin', icon: KeyRound, action: () => { onNavigate('superadmin'); onClose(); } });
  }

  const filtered = ACTIONS.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#080C14]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl rounded-2xl bg-[#080C14] border border-[#00E5FF]/40 shadow-2xl overflow-hidden uf-glow">
        {/* Search Bar Input */}
        <div className="p-4 border-b border-[#94A3B8]/20 flex items-center gap-3">
          <Search className="w-5 h-5 text-[#00E5FF]" />
          <input
            type="text"
            placeholder="Escribe un comando o busca una vista (Ctrl + K)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm font-bold text-[#FFFFFF] focus:outline-none placeholder-[#94A3B8]"
            autoFocus
          />
          <button onClick={onClose} className="px-2 py-1 rounded bg-[#94A3B8]/20 text-[10px] font-mono text-[#94A3B8]">
            ESC
          </button>
        </div>

        {/* Action Items List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#94A3B8] italic">No se encontraron comandos para "{search}"</div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between p-3 rounded-xl text-xs font-bold text-[#FFFFFF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#00E5FF] group-hover:scale-110 transition-transform" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#94A3B8]">Ejecutar</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
