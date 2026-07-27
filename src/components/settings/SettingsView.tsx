import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { CURRENCIES } from '../../lib/constants';
import { CurrencyCode } from '../../types';
import {
  User,
  CheckCircle,
  CreditCard,
  Sun,
  Moon,
  Camera,
  Sparkles,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
];

export const SettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { currency, setCurrency, theme, toggleTheme } = useFinance();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || PRESET_AVATARS[0]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName,
      avatar_url: avatarUrl,
    });
    setSavedMsg('Perfil y avatar actualizados correctamente.');
    setTimeout(() => setSavedMsg(''), 3500);
  };

  const handleSelectPreset = (url: string) => {
    setAvatarUrl(url);
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      setAvatarUrl(customUrlInput.trim());
      setCustomUrlInput('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#FFFFFF]">
          Perfil y Preferencias del Sistema
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Personaliza tu avatar, nombre de usuario, tema visual y moneda predeterminada
        </p>
      </div>

      {savedMsg && (
        <div className="p-3.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-xs font-bold text-[#00E5FF] flex items-center gap-2 uf-glow-sm">
          <CheckCircle className="w-4 h-4" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile & Avatar Selector */}
        <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
            <User className="w-4 h-4" />
            <span>Perfil y Avatar de Usuario</span>
          </div>

          {/* Current Avatar Display */}
          <div className="flex items-center gap-4 p-3 rounded-xl bg-[#080C14] border border-[#00E5FF]/30 uf-glow-sm">
            <div className="relative">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00E5FF] uf-glow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#00E5FF] rounded-full text-[#080C14] flex items-center justify-center">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#FFFFFF]">{user?.full_name || 'Usuario'}</h4>
              <p className="text-xs text-[#94A3B8] font-mono">{user?.email}</p>
              <div className="mt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                  {user?.role === 'superadmin' ? 'SUPERADMIN' : 'USUARIO ACTIVO'}
                </span>
              </div>
            </div>
          </div>

          {/* Preset Avatars Grid */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-2">
              Seleccionar de la Galería de Avatares
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectPreset(url)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    avatarUrl === url
                      ? 'border-[#00E5FF] uf-glow-sm ring-2 ring-[#00E5FF]/50'
                      : 'border-[#94A3B8]/20 hover:border-[#00E5FF]/50'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-12 object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Avatar URL */}
          <div>
            <label className="block text-xs font-bold text-[#94A3B8] mb-1">
              O ingresar URL de imagen personalizada
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:border-[#00E5FF]"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="px-3 py-2 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold hover:bg-[#00E5FF]/10"
              >
                Aplicar
              </button>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3 pt-2 border-t border-[#94A3B8]/15">
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

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-bold hover:bg-[#00E5FF]/90 transition-colors uf-glow-sm uppercase tracking-wide"
            >
              Guardar Cambios de Perfil
            </button>
          </form>
        </div>

        {/* Currency & Visual Preferences */}
        <div className="p-6 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-[#00E5FF] font-bold text-sm">
            <CreditCard className="w-4 h-4" />
            <span>Preferencias Visuales y Moneda</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Moneda Principal
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2.5 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#080C14] text-[#FFFFFF]">
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 p-4 rounded-xl bg-[#080C14] border border-[#94A3B8]/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#FFFFFF]">
                  Tema de la Interfaz
                </p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Alterna entre Modo Oscuro y Modo Claro
                </p>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold hover:bg-[#00E5FF]/20 transition-all uf-glow-sm"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[#00E5FF]" /> Cambiar a Modo Claro
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#00E5FF]" /> Cambiar a Modo Oscuro
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#00E5FF]">
                <ShieldCheck className="w-4 h-4" />
                <span>Sincronización en Tiempo Real Activa</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Tus transacciones, presupuestos y categorías se sincronizan en tiempo real en todos tus dispositivos (Teléfono Móvil, Tablet y PC) a través de la nube de Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
