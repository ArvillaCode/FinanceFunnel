import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionList } from './components/transactions/TransactionList';
import { BudgetManager } from './components/budgets/BudgetManager';
import { CategoryList } from './components/categories/CategoryList';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Transaction } from './types';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isDemoUser, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-[#00E5FF] gap-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-xs font-bold tracking-wider uppercase text-[#94A3B8]">Cargando Upfunnel Finance...</span>
      </div>
    );
  }

  // Primera pantalla obligatoria: Login / Registro si no hay sesión iniciada
  if (!user && !isDemoUser) {
    return <AuthScreen />;
  }

  const handleOpenNewTx = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080C14] text-[#FFFFFF] font-['Inter'] transition-colors">
      {/* Top Bar */}
      <Navbar
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenNewTxModal={handleOpenNewTx}
        onNavigate={setActiveView}
        activeView={activeView}
      />

      {/* Content Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeView={activeView}
          onNavigate={setActiveView}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenNewTxModal={handleOpenNewTx}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              onNavigate={setActiveView}
              onEditTransaction={handleEditTx}
              onOpenNewTxModal={handleOpenNewTx}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionList
              onEditTransaction={handleEditTx}
              onOpenNewTxModal={handleOpenNewTx}
            />
          )}

          {activeView === 'budgets' && <BudgetManager />}

          {activeView === 'categories' && <CategoryList />}

          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeView={activeView}
        onNavigate={setActiveView}
        onOpenNewTxModal={handleOpenNewTx}
      />

      {/* Modals & Toasts */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        transactionToEdit={editingTx}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FinanceProvider>
          <MainLayout />
        </FinanceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
