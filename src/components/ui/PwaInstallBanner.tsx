import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, Sparkles, CheckCircle2 } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Strict check if already running in installed PWA standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('ff_pwa_installed') === 'true';

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    // 2. Check if device is mobile
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    const isMobileDevice = mobileRegex.test(userAgent) || (window.innerWidth <= 768 && 'ontouchstart' in window);

    const iosCheck = /iPhone|iPad|iPod/i.test(userAgent);
    setIsIOS(iosCheck);

    // 3. Check dismissal memory (Wait 3 days if user previously closed the prompt)
    const lastDismissed = localStorage.getItem('ff_pwa_dismissed_time');
    if (lastDismissed) {
      const elapsed = Date.now() - parseInt(lastDismissed, 10);
      const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
      if (elapsed < threeDaysMs) {
        setIsVisible(false);
        return;
      }
    }

    // 4. Android / Chrome beforeinstallprompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isMobileDevice) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. iOS Safari fallback (Safari doesn't support beforeinstallprompt)
    if (iosCheck && isMobileDevice && !isStandalone) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('ff_pwa_installed', 'true');
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('ff_pwa_dismissed_time', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#080C14]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-[#080C14] border border-[#00E5FF]/40 rounded-3xl p-6 shadow-2xl uf-glow space-y-5 animate-slideUp relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#94A3B8]/10 text-[#94A3B8] hover:text-[#FFFFFF] transition-all"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#080C14] border-2 border-[#00E5FF] p-2 flex items-center justify-center uf-glow-sm shrink-0">
            <img src="/favicon.svg" alt="FinanceFunnel App" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#00E5FF] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Experiencia Nativa Móvil</span>
            </div>
            <h3 className="text-base font-black text-[#FFFFFF] mt-0.5">
              Instalar FinanceFunnel
            </h3>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Accede a tu gestor financiero directamente desde tu pantalla de inicio sin barra de navegador, con mayor rapidez y soporte offline.
        </p>

        {/* Features Checklist */}
        <div className="space-y-2 bg-[#080C14] border border-[#94A3B8]/15 rounded-2xl p-3.5 text-xs text-[#94A3B8]">
          <div className="flex items-center gap-2 text-[#FFFFFF]">
            <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
            <span>Pantalla completa sin distracciones</span>
          </div>
          <div className="flex items-center gap-2 text-[#FFFFFF]">
            <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
            <span>Funcionamiento ultrarrápido y offline</span>
          </div>
          <div className="flex items-center gap-2 text-[#FFFFFF]">
            <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
            <span>Acceso directo seguro con 1 toque</span>
          </div>
        </div>

        {/* Dynamic Action Buttons for Android vs iOS */}
        {isIOS ? (
          <div className="p-4 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 space-y-2">
            <p className="text-xs font-bold text-[#00E5FF] flex items-center gap-1.5">
              <Share className="w-4 h-4" /> Pasos para instalar en iPhone / iPad:
            </p>
            <ol className="text-[11px] text-[#94A3B8] space-y-1 list-decimal list-inside pl-1">
              <li>Toca el botón <span className="text-[#FFFFFF] font-bold">Compartir ⎘</span> en tu navegador Safari.</li>
              <li>Desplázate y selecciona <span className="text-[#00E5FF] font-bold">"Agregar a inicio" ➕</span>.</li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2.5 rounded-xl bg-[#00E5FF] text-[#080C14] font-extrabold text-xs uppercase tracking-wider uf-glow-sm"
            >
              Entendido
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] font-bold text-xs hover:text-[#FFFFFF] transition-all"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 py-3 rounded-xl bg-[#00E5FF] text-[#080C14] font-extrabold text-xs uppercase tracking-wider uf-glow-sm hover:bg-[#FFFFFF] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 stroke-[3]" />
              <span>Instalar App</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
