import React from 'react';
import { LayoutDashboard, ArrowRightLeft, PieChart, Tags, Plus } from 'lucide-react';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenNewTxModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  onNavigate,
  onOpenNewTxModal,
}) => {
  const items = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'transactions', label: 'Historial', icon: ArrowRightLeft },
    { id: 'add', label: 'Nuevo', icon: Plus, isAction: true },
    { id: 'budgets', label: 'Límites', icon: PieChart },
    { id: 'categories', label: 'Categorías', icon: Tags },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/90 backdrop-blur-md border-t border-[#94A3B8]/20 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={onOpenNewTxModal}
                className="w-11 h-11 -mt-5 rounded-full bg-[#00E5FF] text-[#080C14] flex items-center justify-center shadow-lg shadow-[#00E5FF]/30 hover:scale-105 active:scale-95 transition-transform uf-glow-sm"
                title="Agregar Transacción"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }

          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 p-1.5 min-w-[50px] transition-colors ${
                isActive
                  ? 'text-[#00E5FF] font-bold uf-glow-sm'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
