import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../types';
import { isSupabaseConfigured, saveCustomSupabaseCredentials } from '../../lib/supabase';
import {
  User,
  Database,
  RotateCcw,
  CheckCircle,
  CreditCard,
  Sun,
  Moon,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { currency, setCurrency, resetDemoData, theme, toggleTheme } = useFinance();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('custom_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('custom_supabase_key') || ''
  );
  const [savedMsg, setSavedMsg] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ full_name: fullName });
    setSavedMsg('Perfil actualizado correctamente.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseCredentials(supabaseUrl.trim(), supabaseKey.trim());
  };

  const handleClearSupabase = () => {
    setSupabaseUrl('');
    setSupabaseKey('');
    saveCustomSupabaseCredentials('', '');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#FFFFFF]">
          Perfil y Configuración
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Ajusta tus preferencias, moneda principal y conexión a la base de datos Supabase
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-xs font-bold text-[#00E5FF] flex items-center gap-2 uf-glow-sm">
          <CheckCircle className="w-4 h-4" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
            <User className="w-4 h-4" />
            <span>Perfil de Usuario</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Correo Electrónico
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'demo@ejemplo.com'}
                className="w-full px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/20 rounded-xl text-xs font-medium text-[#94A3B8] cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-bold hover:bg-[#00E5FF]/90 transition-colors uf-glow-sm"
            >
              Actualizar Perfil
            </button>
          </form>
        </div>

        {/* Currency Preferences */}
        <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
            <CreditCard className="w-4 h-4" />
            <span>Preferencias Visuales y Moneda</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Moneda Principal
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#080C14] text-[#FFFFFF]">
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#FFFFFF]">
                  Tema de la Interfaz
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Modo Oscuro Upfunnel Activo
                </p>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[#00E5FF]" /> Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#00E5FF]" /> Modo Oscuro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Connection */}
      <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Conexión a Supabase (PostgreSQL RLS)</span>
          </div>

          <span className="text-xs px-2.5 py-1 font-bold rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
            {isSupabaseConfigured ? 'Conectado a Supabase' : 'Modo Demo Persistent'}
          </span>
        </div>

        <p className="text-xs text-[#94A3B8]">
          Puedes conectar tu proyecto propio de Supabase ingresando tus credenciales a continuación. Si no las proporcionas, la aplicación funcionará en modo persistente local con datos guardados en tu navegador.
        </p>

        <form onSubmit={handleSaveSupabase} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-mono text-[#FFFFFF] focus:border-[#00E5FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-mono text-[#FFFFFF] focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-bold hover:bg-[#00E5FF]/90 transition-colors uf-glow-sm"
            >
              Guardar y Conectar Supabase
            </button>

            {supabaseUrl && (
              <button
                type="button"
                onClick={handleClearSupabase}
                className="px-4 py-2 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] text-xs font-semibold hover:text-[#FFFFFF] transition-colors"
              >
                Desconectar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Reset Demo Data */}
      <div className="p-6 rounded-2xl bg-[#080C14] border border-[#00E5FF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 uf-glow-sm">
        <div>
          <h4 className="text-sm font-bold text-[#FFFFFF] flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-[#00E5FF]" /> Restablecer Datos de Demostración
          </h4>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Vuelve a generar las transacciones y presupuestos de prueba de los últimos 6 meses.
          </p>
        </div>

        <button
          onClick={resetDemoData}
          className="px-4 py-2 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] text-xs font-bold hover:bg-[#00E5FF]/20 transition-colors shrink-0"
        >
          Restablecer Demo
        </button>
      </div>
    </div>
  );
};
