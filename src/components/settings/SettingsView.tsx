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
  Sparkles,
  CheckCircle,
  Key,
  Shield,
  CreditCard,
  Sun,
  Moon,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateProfile, isDemoUser } = useAuth();
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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Perfil y Configuración
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Ajusta tus preferencias, moneda principal y conexión a la base de datos Supabase
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <User className="w-4 h-4" />
            <span>Perfil de Usuario</span>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="text"
                disabled
                value={user?.email || 'demo@ejemplo.com'}
                className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Actualizar Perfil
            </button>
          </form>
        </div>

        {/* Currency & Theme Preferences */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <CreditCard className="w-4 h-4" />
            <span>Preferencias Visuales y Moneda</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moneda Principal
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Tema de la Interfaz
                </p>
                <p className="text-[11px] text-slate-400">
                  Modo {theme === 'dark' ? 'Oscuro' : 'Claro'} activo
                </p>
              </div>

              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" /> Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" /> Modo Oscuro
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Connection */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Database className="w-4 h-4" />
            <span>Conexión a Supabase (PostgreSQL RLS)</span>
          </div>

          <span
            className={`text-xs px-2.5 py-1 font-bold rounded-lg ${
              isSupabaseConfigured
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {isSupabaseConfigured ? 'Conectado a Supabase' : 'Modo Demo Persistent'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Puedes conectar tu proyecto propio de Supabase ingresando tus credenciales a continuación. Si no las proporcionas, la aplicación funcionará en modo persistente local con datos guardados en tu navegador.
        </p>

        <form onSubmit={handleSaveSupabase} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              Guardar y Conectar Supabase
            </button>

            {supabaseUrl && (
              <button
                type="button"
                onClick={handleClearSupabase}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 dark:border-rose-900/60 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                Desconectar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Reset Demo Data */}
      <div className="p-6 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" /> Restablecer Datos de Demostración
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            Vuelve a generar las transacciones y presupuestos de prueba de los últimos 6 meses.
          </p>
        </div>

        <button
          onClick={resetDemoData}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shrink-0"
        >
          Restablecer Demo
        </button>
      </div>
    </div>
  );
};
