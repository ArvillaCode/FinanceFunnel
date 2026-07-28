import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signUp, resetPassword, enableDemoMode } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'forgot') {
        if (!email) {
          setError('Ingresa tu correo electrónico.');
          setLoading(false);
          return;
        }
        const res = await resetPassword(email);
        if (res.success) {
          setSuccessMsg(res.message);
        } else {
          setError(res.message);
        }
      } else if (mode === 'signup') {
        if (!fullName || !email || !password) {
          setError('Por favor completa todos los campos.');
          setLoading(false);
          return;
        }
        const res = await signUp(fullName, email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        if (!email) {
          setError('Ingresa tu correo.');
          setLoading(false);
          return;
        }
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    enableDemoMode();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'signin'
          ? 'Iniciar Sesión'
          : mode === 'signup'
          ? 'Crear Cuenta'
          : 'Recuperar Contraseña'
      }
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Fast Demo Access Banner */}
        <div className="p-3.5 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 flex items-center justify-between uf-glow-sm">
          <div>
            <p className="text-xs font-bold text-[#00E5FF] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" /> Acceso Rápido Demo
            </p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Prueba la app de inmediato sin registrarte.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            className="px-3 py-1.5 rounded-lg bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-bold transition-all shrink-0 uf-glow-sm"
          >
            Entrar como Demo
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-[#080C14] border border-[#FFFFFF] text-xs text-[#FFFFFF] font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FFFFFF]" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-[#080C14] border border-[#00E5FF]/40 text-xs text-[#00E5FF] font-bold flex items-center gap-2 uf-glow-sm">
            <CheckCircle className="w-4 h-4 shrink-0 text-[#00E5FF]" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#94A3B8]">
                  Contraseña
                </label>
                {mode === 'signin' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] font-bold text-[#00E5FF] hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs font-medium text-[#FFFFFF] focus:border-[#00E5FF]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] text-xs font-bold shadow-md shadow-[#00E5FF]/20 transition-all mt-2 uf-glow-sm"
          >
            {loading
              ? 'Procesando...'
              : mode === 'signin'
              ? 'Iniciar Sesión'
              : mode === 'signup'
              ? 'Registrarse'
              : 'Enviar Correo de Recuperación'}
          </button>
        </form>

        {/* Toggle Mode Footer */}
        <div className="pt-3 border-t border-[#94A3B8]/20 text-center text-xs text-[#94A3B8]">
          {mode === 'signin' ? (
            <p>
              ¿No tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-[#00E5FF] hover:underline"
              >
                Regístrate
              </button>
            </p>
          ) : (
            <p>
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-bold text-[#00E5FF] hover:underline"
              >
                Inicia Sesión
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
