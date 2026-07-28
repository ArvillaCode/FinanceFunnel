import React, { useState, useEffect } from 'react';
import { Download, X, Share, Sparkles, CheckCircle2, Info, Monitor, Smartphone } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  useEffect(() => {
    // 1. Strict check if already running in standalone native PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsVisible(false);
      return;
    }

    const isDismissed = localStorage.getItem('ff_pwa_dismissed') === 'true';

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const iosCheck =
      (/iPhone|iPad|iPod/i.test(userAgent) ||
        (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1)) &&
      !(window as any).MSStream;
    setIsIOS(iosCheck);

    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
      if (!isDismissed) {
        setIsVisible(true);
      }
    }

    const handlePromptReady = () => {
      const prompt = (window as any).deferredPwaPrompt;
      if (prompt) {
        setDeferredPrompt(prompt);
        if (!isDismissed) {
          setIsVisible(true);
        }
      }
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e);
      if (!isDismissed) {
        setIsVisible(true);
      }
    };

    const handleOpenBanner = () => {
      localStorage.removeItem('ff_pwa_dismissed');
      setShowManualGuide(iosCheck || !(window as any).deferredPwaPrompt);
      setIsVisible(true);
    };

    const handleInstalled = () => {
      (window as any).deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsVisible(false);
      setShowManualGuide(false);
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('open-pwa-banner', handleOpenBanner);
    window.addEventListener('appinstalled', handleInstalled);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (iosCheck && !isStandalone && !isDismissed) {
      iosTimer = setTimeout(() => {
        setShowManualGuide(true);
        setIsVisible(true);
      }, 1500);
    }

    return () => {
      if (iosTimer) clearTimeout(iosTimer);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-banner', handleOpenBanner);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const activePrompt = (window as any).deferredPwaPrompt || deferredPrompt;

    if (activePrompt && typeof activePrompt.prompt === 'function') {
      try {
        await activePrompt.prompt();
        const choiceResult = await activePrompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          localStorage.setItem('ff_pwa_installed', 'true');
        }
        setIsVisible(false);
      } catch (err) {
        console.warn('Error activando instalación PWA nativa:', err);
        setShowManualGuide(true);
      }
      (window as any).deferredPwaPrompt = null;
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowManualGuide(true);
    } else {
      setShowManualGuide(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('ff_pwa_dismissed', 'true');
    setIsVisible(false);
    setShowManualGuide(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#080C14]/85 backdrop-blur-md animate-fadeIn">
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
              <span>Aplicación Nativa PWA</span>
            </div>
            <h3 className="text-base font-black text-[#FFFFFF] mt-0.5">
              Instalar FinanceFunnel
            </h3>
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] leading-relaxed">
          Instala la App nativa en tu dispositivo para ingresar sin la barra del navegador, con acceso más rápido y experiencia a pantalla completa.
        </p>

        {/* Features Checklist */}
        {!showManualGuide && (
          <div className="space-y-2 bg-[#080C14] border border-[#94A3B8]/15 rounded-2xl p-3.5 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-2 text-[#FFFFFF]">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
              <span>Pantalla completa nativa sin barra del navegador</span>
            </div>
            <div className="flex items-center gap-2 text-[#FFFFFF]">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
              <span>Rendimiento optimizado y soporte offline</span>
            </div>
            <div className="flex items-center gap-2 text-[#FFFFFF]">
              <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
              <span>Acceso directo seguro con 1 toque</span>
            </div>
          </div>
        )}

        {/* Guided steps if native prompt is not direct */}
        {showManualGuide ? (
          <div className="p-4 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00E5FF]">
              <Info className="w-4 h-4 shrink-0" />
              <span>Instrucciones de instalación:</span>
            </div>

            {isIOS ? (
              <ol className="text-[11px] text-[#94A3B8] space-y-1.5 list-decimal list-inside pl-1">
                <li className="flex items-center gap-1">Toca <Share className="w-3.5 h-3.5" /> <span className="text-[#FFFFFF] font-bold">Compartir</span> en Safari.</li>
                <li>Selecciona <span className="text-[#00E5FF] font-bold">"Agregar a inicio"</span>.</li>
              </ol>
            ) : (
              <div className="space-y-2 text-[11px] text-[#94A3B8]">
                <div className="flex items-start gap-2">
                  <Monitor className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#FFFFFF]">Navegadores de Escritorio (Chrome/Edge):</strong> Haz clic en el ícono de instalación <strong className="text-[#00E5FF]">⊕</strong> ubicado a la derecha en la barra de direcciones superior.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#FFFFFF]">Móviles Android:</strong> Abre el menú de opciones <strong className="text-[#00E5FF]">⋮</strong> del navegador y selecciona <strong>"Instalar aplicación"</strong>.
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8]/80 italic pt-1 border-t border-[#94A3B8]/15">
                  * Nota: Las aplicaciones PWA requieren conexión segura HTTPS (o localhost) para habilitar la instalación directa en 1 clic.
                </p>
              </div>
            )}

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
