import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User as UserIcon, Sparkles, ArrowRight, ShieldCheck, TrendingUp, AlertCircle } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, enableDemoMode } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);

  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          setError('Por favor completa todos los campos.');
          setLoading(false);
          return;
        }
        const res = await signUp(fullName.trim(), email.trim(), password.trim());
        if (res.error) setError(res.error);
      } else {
        if (!email.trim() || !password.trim()) {
          setError('Ingresa tu correo y contraseña.');
          setLoading(false);
          return;
        }
        const res = await signIn(email.trim(), password.trim());
        if (res.error) setError(res.error);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al conectar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-[#FFFFFF] font-['Inter'] flex flex-col justify-between relative overflow-hidden">
      {/* Background Glow Accents */}
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
          onClick={enableDemoMode}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/40 text-xs font-bold transition-all uf-glow-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>Probar Demo Modo Invitado</span>
        </button>
      </header>

      {/* Main Login / Register Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
        <div className="w-full max-w-md bg-[#080C14] border border-[#00E5FF]/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 uf-glow">
          {/* Header text */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-black text-[#FFFFFF]">
              {isSignUp ? 'Crear tu Cuenta' : 'Iniciar Sesión'}
            </h1>
            <p className="text-xs text-[#94A3B8]">
              {isSignUp
                ? 'Ingresa tus datos para registrarte en Upfunnel Finance'
                : 'Accede a tu panel financiero con tu correo y contraseña'}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-[#080C14] border border-[#FFFFFF] text-xs font-bold text-[#FFFFFF] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FFFFFF]" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="email"
                  placeholder="tu.correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-black tracking-wide uppercase transition-all shadow-md flex items-center justify-center gap-2 uf-glow-sm disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Cargando...' : isSignUp ? 'Registrarse Ahora' : 'Ingresar a mi Cuenta'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="pt-4 border-t border-[#94A3B8]/15 text-center text-xs text-[#94A3B8]">
            {isSignUp ? (
              <p>
                ¿Ya tienes una cuenta?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="font-bold text-[#00E5FF] hover:underline ml-1"
                >
                  Inicia Sesión aquí
                </button>
              </p>
            ) : (
              <p>
                ¿No tienes una cuenta aún?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className="font-bold text-[#00E5FF] hover:underline ml-1"
                >
                  Regístrate aquí
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-xs text-[#94A3B8] border-t border-[#94A3B8]/10 z-10 font-mono">
        Upfunnel Finance © 2026 • Sistema de Gestión Financiera y Control de Presupuestos
      </footer>
    </div>
  );
};
