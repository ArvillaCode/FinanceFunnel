import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../lib/supabaseService';
import { KeyRound, ShieldAlert, CheckCircle2, LogOut, Loader2, Sparkles, ArrowRight } from 'lucide-react';

interface LicenseGateProps {
  reason?: 'missing' | 'paused' | 'revoked' | 'expired';
}

export const LicenseGate: React.FC<LicenseGateProps> = ({ reason = 'missing' }) => {
  const { user, signOut, refreshUserLicense } = useAuth();
  const [keyCode, setKeyCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyCode.trim()) {
      setError('Por favor ingresa una clave de licencia válida.');
      return;
    }

    if (!user) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await supabaseService.activateLicenseForKey(user.id, keyCode.trim(), user.email);
      if (!res.success) {
        setError(res.message);
      } else {
        setSuccess('¡Licencia activada correctamente! Accediendo a tu plataforma...');
        await refreshUserLicense();
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor de licencias.');
    } finally {
      setLoading(false);
    }
  };

  const getNoticeContent = () => {
    switch (reason) {
      case 'paused':
        return {
          title: 'Licencia Pausada Temporalmente',
          desc: 'Tu licencia ha sido pausada por el administrador. Ponte en contacto con soporte para reanudar el servicio o activa una nueva clave a continuación.',
          badgeColor: 'border-[#FFFFFF] text-[#FFFFFF]',
        };
      case 'revoked':
        return {
          title: 'Licencia Revocada',
          desc: 'Tu licencia ha sido anulada permanentemente por el administrador. Para recuperar el acceso, ingresa una nueva clave de licencia válida.',
          badgeColor: 'border-rose-500 text-rose-400',
        };
      case 'expired':
        return {
          title: 'Licencia Expirada',
          desc: 'El periodo de vigencia de tu suscripción ha finalizado. Renueva o ingresa una nueva clave para continuar utilizando la plataforma.',
          badgeColor: 'border-[#94A3B8] text-[#94A3B8]',
        };
      case 'missing':
      default:
        return {
          title: 'Licencia Requerida',
          desc: 'Para acceder a FinanceFunnel, tu cuenta requiere una clave de licencia activa generada por el Administrador.',
          badgeColor: 'border-[#00E5FF] text-[#00E5FF]',
        };
    }
  };

  const notice = getNoticeContent();

  return (
    <div className="min-h-screen bg-[#080C14] text-[#FFFFFF] font-['Inter'] flex flex-col justify-between relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#00E5FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#00E5FF]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="px-6 py-6 max-w-7xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 text-[#00E5FF] flex items-center justify-center font-black text-xl uf-glow">
            ▲
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-[#FFFFFF]">UPFUNNEL</span>
            <span className="text-xs text-[#00E5FF] font-bold block -mt-1 tracking-widest uppercase">Finance</span>
          </div>
        </div>

        <button
          onClick={signOut}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#080C14] border border-[#94A3B8]/30 hover:border-[#00E5FF] text-[#94A3B8] hover:text-[#FFFFFF] text-xs font-bold transition-all"
        >
          <LogOut className="w-4 h-4 text-[#00E5FF]" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      {/* Main License Gate Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-lg bg-[#080C14] border border-[#00E5FF]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 uf-glow">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 text-[#00E5FF] flex items-center justify-center uf-glow-sm">
              {reason === 'revoked' ? (
                <ShieldAlert className="w-7 h-7 text-rose-400" />
              ) : (
                <KeyRound className="w-7 h-7 text-[#00E5FF]" />
              )}
            </div>

            <div>
              <h1 className="text-2xl font-black text-[#FFFFFF] tracking-tight">
                {notice.title}
              </h1>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1 leading-relaxed">
                {notice.desc}
              </p>
            </div>

            <div className="text-[11px] font-bold text-[#94A3B8] bg-[#080C14] px-3 py-1 rounded-full border border-[#94A3B8]/20">
              Usuario: <span className="text-[#FFFFFF]">{user?.email}</span>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#FFFFFF] text-xs font-bold text-[#FFFFFF] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#FFFFFF]" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 text-xs font-bold text-[#00E5FF] flex items-center gap-2 uf-glow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00E5FF]" />
              <span>{success}</span>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1.5">
                Ingresar Clave de Licencia
              </label>
              <input
                type="text"
                placeholder="Ej. FF-8A32-9X1B-409Z"
                value={keyCode}
                onChange={(e) => setKeyCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-sm font-mono tracking-widest text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF] uppercase transition-colors"
              />
              <span className="text-[11px] text-[#94A3B8] mt-1 block">
                Solicita tu clave de 1, 3, 6 meses o 1 año al Administrador.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-black tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2 uf-glow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando Clave...</span>
                </>
              ) : (
                <>
                  <span>Activar y Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#94A3B8]/15 text-center text-xs text-[#94A3B8]">
            ¿No tienes una clave aún? Contacta con el equipo de Upfunnel Finance para adquirir o renovar tu licencia.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-[#94A3B8] border-t border-[#94A3B8]/10 z-10 font-mono">
        Upfunnel Finance SaaS © 2026 • Acceso Protegido por Licencia Única
      </footer>
    </div>
  );
};
