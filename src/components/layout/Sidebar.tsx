import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ArrowRightLeft,
  PieChart,
  Tags,
  Settings,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenNewTxModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  onOpenNewTxModal,
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transacciones', icon: ArrowRightLeft },
    { id: 'budgets', label: 'Presupuestos', icon: PieChart },
    { id: 'categories', label: 'Categorías', icon: Tags },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  if (user?.role === 'superadmin') {
    navItems.unshift({ id: 'superadmin', label: 'Panel SuperAdmin', icon: KeyRound });
  }

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-[#94A3B8]/20 bg-[#080C14] transition-all duration-300 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Collapse Toggle */}
      <div className="p-4 flex items-center justify-end">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#94A3B8]/10 transition-colors"
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Quick Add Button */}
      <div className="px-3 mb-4">
        <button
          onClick={onOpenNewTxModal}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] font-bold text-sm shadow-md shadow-[#00E5FF]/20 transition-all uf-glow-sm ${
            isCollapsed ? 'px-0' : ''
          }`}
          title="Agregar Transacción"
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Nueva Transacción</span>}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isSuperAdminItem = item.id === 'superadmin';
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] font-bold shadow-xs uf-glow-sm'
                  : isSuperAdminItem
                  ? 'text-[#00E5FF] hover:bg-[#00E5FF]/10 font-bold'
                  : 'text-[#94A3B8] hover:bg-[#94A3B8]/10 hover:text-[#FFFFFF]'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive || isSuperAdminItem ? 'text-[#00E5FF]' : ''}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-[#94A3B8]/15 text-[11px] text-[#94A3B8] text-center font-mono">
          Upfunnel Finance SaaS v1.0
        </div>
      )}
    </aside>
  );
};
