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
import { TeamManagerView } from './components/team/TeamManagerView';
import { BillingView } from './components/billing/BillingView';
import { DataCenterView } from './components/datacenter/DataCenterView';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { QuickActionCommandModal } from './components/ui/QuickActionCommandModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { LicenseGate } from './components/auth/LicenseGate';
import { SuperAdminView } from './components/superadmin/SuperAdminView';
import { ToastContainer } from './components/ui/Toast';
import { PwaInstallBanner } from './components/ui/PwaInstallBanner';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Transaction } from './types';
import { Loader2, ShieldAlert } from 'lucide-react';

const getInitialView = (): string => {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash) return hash;
  const saved = localStorage.getItem('uf_active_view');
  return saved || 'dashboard';
};

const MainLayout: React.FC = () => {
  const { user, isDemoUser, isLoading, activeLicense, isLicenseValid, signOut } = useAuth();
  const [activeView, setActiveViewState] = useState<string>(getInitialView);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const handleNavigate = (view: string) => {
    setActiveViewState(view);
    localStorage.setItem('uf_active_view', view);
    window.location.hash = `#${view}`;
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash) {
        setActiveViewState(hash);
        localStorage.setItem('uf_active_view', hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-[#00E5FF] gap-3">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-xs font-bold tracking-wider uppercase text-[#94A3B8]">
          Cargando Upfunnel Finance...
        </span>
      </div>
    );
  }

  // 1. Pantalla Inicial Obligatoria: Iniciar Sesión / Registro
  if (!user && !isDemoUser) {
    return <AuthScreen />;
  }

  // 2. Pantalla de Usuario Baneado
  if (user?.is_banned) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-[#FFFFFF] p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-600/40 text-rose-400 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-[#FFFFFF]">Cuenta Suspendida</h1>
        <p className="text-xs text-[#94A3B8] max-w-sm mt-1">
          Tu cuenta ha sido deshabilitada por el Administrador. Contacta a soporte para más información.
        </p>
        <button
          onClick={signOut}
          className="mt-6 px-4 py-2 rounded-xl bg-[#080C14] border border-[#94A3B8]/30 text-xs font-bold text-[#94A3B8] hover:text-[#FFFFFF]"
        >
          Cerrar Sesión
        </button>
      </div>
    );
  }

  // 3. Pantalla de Licencia Requerida (LicenseGate)
  if (!isLicenseValid && !isDemoUser) {
    return <LicenseGate reason={activeLicense?.status as any || 'missing'} />;
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
        onOpenCommandModal={() => setIsCommandModalOpen(true)}
        onNavigate={handleNavigate}
        activeView={activeView}
      />

      {/* Content Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onOpenNewTxModal={handleOpenNewTx}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto">
          {activeView === 'superadmin' && user?.role === 'superadmin' && (
            <SuperAdminView />
          )}

          {activeView === 'dashboard' && (
            <DashboardView
              onNavigate={handleNavigate}
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

          {activeView === 'team' && <TeamManagerView />}

          {activeView === 'billing' && <BillingView />}

          {activeView === 'datacenter' && <DataCenterView />}

          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenNewTxModal={handleOpenNewTx}
      />

      {/* Modals & Toasts */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        transactionToEdit={editingTx}
      />

      <QuickActionCommandModal
        isOpen={isCommandModalOpen}
        onClose={() => setIsCommandModalOpen(false)}
        onNavigate={handleNavigate}
        onOpenNewTxModal={handleOpenNewTx}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <ToastContainer />
      <PwaInstallBanner />
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
