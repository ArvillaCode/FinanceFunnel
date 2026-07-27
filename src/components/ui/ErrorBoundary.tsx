import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleClearStorage = () => {
    localStorage.clear();
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080C14] text-[#FFFFFF] font-['Inter'] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl bg-[#080C14] border border-[#94A3B8]/30 shadow-2xl text-center space-y-6 uf-glow-sm">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#FFFFFF] tracking-tight">
                Ocurrió un error inesperado
              </h2>
              <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
                La aplicación detectó una excepción no controlada en la interfaz. No te preocupes, tus datos están a salvo.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left overflow-x-auto">
                <p className="text-[11px] font-mono text-rose-300 truncate">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] font-bold text-xs shadow-md shadow-[#00E5FF]/20 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recargar App</span>
              </button>

              <button
                onClick={this.handleClearStorage}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#94A3B8]/30 text-[#94A3B8] hover:text-rose-400 hover:border-rose-500/40 text-xs font-semibold transition-all"
                title="Limpiar datos de sesión locales"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpiar Cache</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
