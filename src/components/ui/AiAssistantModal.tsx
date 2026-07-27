import React, { useState } from 'react';
import { Sparkles, Bot, Key, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { useFinance } from '../../context/FinanceContext';
import { geminiService } from '../../lib/geminiService';
import { Transaction } from '../../types';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedTransaction: (parsed: Partial<Transaction>) => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedTransaction,
}) => {
  const { categories, addToast } = useFinance();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [hasKey, setHasKey] = useState(geminiService.hasApiKey());

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    geminiService.setApiKey(apiKeyInput);
    setHasKey(true);
    addToast({
      type: 'success',
      title: 'API Key Guardada',
      message: 'La clave de Gemini se ha configurado correctamente.',
    });
  };

  const handleParsePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    setIsParsing(true);
    try {
      const parsed = await geminiService.parseNaturalTransaction(promptText, categories);
      onApplyParsedTransaction({
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        category_id: parsed.category_id || categories[0]?.id,
        notes: parsed.notes,
        transaction_date: new Date().toISOString().split('T')[0],
      });
      addToast({
        type: 'success',
        title: 'IA Transacción Interpretada',
        message: `Detectado ${parsed.type === 'income' ? 'Ingreso' : 'Gasto'} de $${parsed.amount}`,
      });
      onClose();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error de Interpretación',
        message: err.message || 'No se pudo parsear el texto con Gemini.',
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Asistente Financiero IA Gemini">
      <div className="space-y-6 font-['Inter']">
        {/* Banner Header */}
        <div className="p-4 rounded-2xl bg-[#080C14] border border-[#00E5FF]/30 flex items-center gap-3 uf-glow-sm">
          <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#FFFFFF]">Inteligencia Financiera Upfunnel</h4>
            <p className="text-xs text-[#94A3B8]">
              Registra movimientos escribiendo frases sencillas como "Pagué $35 de Uber ayer"
            </p>
          </div>
        </div>

        {/* API Key Configuration if missing */}
        {!hasKey ? (
          <form onSubmit={handleSaveKey} className="p-4 rounded-2xl bg-[#080C14] border border-[#94A3B8]/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#FFFFFF]">
              <Key className="w-4 h-4 text-[#00E5FF]" />
              <span>Configurar Gemini API Key</span>
            </div>
            <input
              type="password"
              placeholder="Ingresa tu VITE_GEMINI_API_KEY..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#080C14] border border-[#94A3B8]/30 rounded-xl text-xs text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF]"
              required
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-[#00E5FF] text-[#080C14] font-bold text-xs shadow-md shadow-[#00E5FF]/20 hover:bg-[#00E5FF]/90 transition-all"
            >
              Guardar API Key
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between text-xs text-[#94A3B8] px-1">
            <span className="flex items-center gap-1.5 text-[#00E5FF]">
              <CheckCircle2 className="w-4 h-4" /> API Key Activa
            </span>
            <button
              onClick={() => {
                geminiService.setApiKey('');
                setHasKey(false);
              }}
              className="hover:text-rose-400 underline transition-colors"
            >
              Cambiar clave
            </button>
          </div>
        )}

        {/* Natural Language Prompt Input */}
        <form onSubmit={handleParsePrompt} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#FFFFFF] mb-1.5">
              Escribe tu movimiento en lenguaje natural:
            </label>
            <textarea
              rows={3}
              placeholder="Ejemplo: 'Compré comestibles en el supermercado por 85.50 dólares hoy'"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="w-full p-3 bg-[#080C14] border border-[#94A3B8]/30 rounded-2xl text-xs text-[#FFFFFF] focus:outline-none focus:border-[#00E5FF] resize-none"
              disabled={!hasKey || isParsing}
            />
          </div>

          <button
            type="submit"
            disabled={!hasKey || !promptText.trim() || isParsing}
            className="w-full py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 disabled:opacity-30 disabled:cursor-not-allowed text-[#080C14] font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#00E5FF]/20 transition-all"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analizando con Gemini 2.5...</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                <span>Interpretar y Autocompletar</span>
              </>
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
};
