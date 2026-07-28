import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 shadow-2xl uf-glow flex items-center justify-between gap-4 animate-slideUp">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 flex items-center justify-center shrink-0 uf-glow-sm">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-xs font-black text-[#FFFFFF] uppercase tracking-wider">
            Instalar App Nativa
          </h4>
          <p className="text-[11px] text-[#94A3B8] mt-0.5">
            Añade FinanceFunnel a tu pantalla de inicio móvil
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3.5 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] text-xs font-extrabold uppercase tracking-wider uf-glow-sm hover:bg-[#FFFFFF] transition-all flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5 stroke-[3]" />
          <span>Instalar</span>
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-1.5 rounded-xl border border-[#94A3B8]/20 text-[#94A3B8] hover:text-[#FFFFFF]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
