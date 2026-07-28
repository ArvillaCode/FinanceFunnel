import React, { useState } from 'react';
import { Sparkles, Bot, Loader2, Key, Send, CheckCircle2, ShieldCheck, TrendingUp, HelpCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { geminiService, ContextualFinancialData } from '../../lib/geminiService';

export const AiAdviceWidget: React.FC = () => {
  const { filteredTransactions, categories, currency, addToast } = useFinance();
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [activeAnalysisMode, setActiveAnalysisMode] = useState<'express' | 'audit' | 'forecast' | 'question'>('express');
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const hasKey = geminiService.hasApiKey();

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savingsRatio = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0';

  // Desglose de categorías de gasto
  const expenseByCategory = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.keys(expenseByCategory)
    .sort((a, b) => expenseByCategory[b] - expenseByCategory[a])
    .map((catId) => {
      const catName = categories.find((c) => c.id === catId)?.name || 'Otros';
      const total = expenseByCategory[catId];
      const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
      return { name: catName, total, percentage };
    });

  const currencySymbol = currency === 'USD' ? '$' : currency;

  const getFinancialContext = (): ContextualFinancialData => ({
    income: totalIncome,
    expenses: totalExpenses,
    balance,
    savingsRatio,
    topCategories: topCategories.slice(0, 5),
    transactionCount: filteredTransactions.length,
    currencySymbol,
  });

  const handleGenerateExpressAdvice = async () => {
    setIsLoading(true);
    setActiveAnalysisMode('express');
    try {
      const advice = await geminiService.generateExpressDiagnosis(contextualData);
      setAdviceText(advice);
    } catch (err) {
      setAdviceText('Error al procesar el diagnóstico financiero.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFullAudit = async () => {
    setIsLoading(true);
    setActiveAnalysisMode('audit');
    try {
      const audit = await geminiService.generateDetailedAudit(getFinancialContext());
      setAdviceText(audit);
    } catch (err) {
      setAdviceText('Error al ejecutar la auditoría financiera.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (userQuestion?: string) => {
    const query = userQuestion || customPrompt;
    if (!query.trim()) return;

    setIsLoading(true);
    setActiveAnalysisMode('question');
    try {
      const answer = await geminiService.askFinancialQuestion(query, getFinancialContext());
      setAdviceText(answer);
      if (!userQuestion) setCustomPrompt('');
    } catch (err) {
      setAdviceText('Error al procesar tu consulta financiera.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    geminiService.setApiKey(apiKeyInput.trim());
    setShowKeyInput(false);
    addToast({
      type: 'success',
      title: 'Clave Configurada',
      message: apiKeyInput.trim() ? 'Clave de Gemini 2.5 Flash API activada.' : 'Usando Motor de Diagnóstico Inteligente Upfunnel.',
    });
  };

  return (
    <div className="p-6 rounded-2xl bg-[#080C14] border border-[#00E5FF]/40 shadow-xl space-y-5 uf-glow-sm relative">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#94A3B8]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 flex items-center justify-center uf-glow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#FFFFFF]">Asesor Inteligente IA</h3>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                hasKey ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40' : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30'
              }`}>
                {hasKey ? 'Gemini 2.5 Flash API' : 'Motor Diagnóstico Upfunnel'}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Auditoría financiera, análisis predictivo de 200+ transacciones e insights en tiempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="p-2 rounded-xl bg-[#080C14] border border-[#94A3B8]/30 text-[#94A3B8] hover:text-[#00E5FF] hover:border-[#00E5FF]/50 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Configurar Clave Gemini API"
          >
            <Key className="w-4 h-4" />
            <span className="hidden sm:inline">Clave API</span>
          </button>
        </div>
      </div>

      {/* Action Modes Selector */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleGenerateExpressAdvice}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
            activeAnalysisMode === 'express' && adviceText
              ? 'bg-[#00E5FF] text-[#080C14] border-[#00E5FF] uf-glow-sm'
              : 'bg-[#080C14] border-[#94A3B8]/30 text-[#94A3B8] hover:text-[#FFFFFF] hover:border-[#00E5FF]/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Diagnóstico Express</span>
        </button>

        <button
          onClick={handleGenerateFullAudit}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
            activeAnalysisMode === 'audit' && adviceText
              ? 'bg-[#00E5FF] text-[#080C14] border-[#00E5FF] uf-glow-sm'
              : 'bg-[#080C14] border-[#94A3B8]/30 text-[#94A3B8] hover:text-[#FFFFFF] hover:border-[#00E5FF]/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Auditoría Completa</span>
        </button>

        <button
          onClick={() => handleAskQuestion("¿Cuál es la proyección de flujo de caja para los próximos 30 días?")}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
            activeAnalysisMode === 'forecast' && adviceText
              ? 'bg-[#00E5FF] text-[#080C14] border-[#00E5FF] uf-glow-sm'
              : 'bg-[#080C14] border-[#94A3B8]/30 text-[#94A3B8] hover:text-[#FFFFFF] hover:border-[#00E5FF]/40'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Pronóstico 30 Días</span>
        </button>
      </div>

      {/* API Key Modal / Expandable Box */}
      {showKeyInput && (
        <div className="p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/30 space-y-3 animate-fadeIn">
          <label className="text-xs font-bold text-[#FFFFFF] flex items-center justify-between">
            <span>Clave Gemini API (Opcional)</span>
            <span className="text-[11px] text-[#94A3B8] font-normal">Obtén tu API key gratis en Google AI Studio</span>
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-2 rounded-xl bg-[#080C14] border border-[#94A3B8]/30 text-xs text-[#FFFFFF] focus:border-[#00E5FF] outline-none font-mono"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-[#080C14] font-bold text-xs hover:bg-[#FFFFFF] transition-all flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      )}

      {/* Advice Output Box */}
      {isLoading ? (
        <div className="p-8 rounded-xl bg-[#080C14] border border-[#00E5FF]/30 flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00E5FF]" />
          <p className="text-xs font-bold text-[#00E5FF] animate-pulse">
            Procesando transacciones y evaluando métricas con IA...
          </p>
        </div>
      ) : adviceText ? (
        <div className="p-4.5 rounded-xl bg-[#080C14] border border-[#00E5FF]/30 text-xs text-[#FFFFFF] leading-relaxed whitespace-pre-line font-['Inter'] shadow-inner space-y-2">
          {adviceText}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-[#080C14] border border-[#94A3B8]/15 text-xs text-[#94A3B8] flex items-center justify-between gap-4">
          <p className="italic">
            Selecciona un análisis arriba o realiza una consulta abajo para procesar tus <strong className="text-[#00E5FF]">{filteredTransactions.length} transacciones</strong> actuales.
          </p>
        </div>
      )}

      {/* Interactive Quick Question Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion();
        }}
        className="flex gap-2 pt-1"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Haz una pregunta financiera (ej: ¿En qué categoría estoy gastando más?)..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#080C14] border border-[#94A3B8]/25 text-xs text-[#FFFFFF] focus:border-[#00E5FF] outline-none transition-all placeholder:text-[#94A3B8]/60"
          />
          <HelpCircle className="w-4 h-4 text-[#94A3B8] absolute left-3 top-3" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !customPrompt.trim()}
          className="px-4 py-2.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#080C14] text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Consultar</span>
        </button>
      </form>
    </div>
  );
};


