import React, { useState } from 'react';
import { Sparkles, Bot, Loader2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { geminiService } from '../../lib/geminiService';

export const AiAdviceWidget: React.FC = () => {
  const { filteredTransactions, categories, currency } = useFinance();
  const [adviceText, setAdviceText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Find top expense category
  const expenseByCategory = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const topCategoryId = Object.keys(expenseByCategory).sort(
    (a, b) => expenseByCategory[b] - expenseByCategory[a]
  )[0];

  const topCategoryName = categories.find((c) => c.id === topCategoryId)?.name || 'N/A';

  const handleGenerateAdvice = async () => {
    setIsLoading(true);
    try {
      const advice = await geminiService.generateFinancialAdvice(
        totalIncome,
        totalExpenses,
        topCategoryName,
        currency === 'USD' ? '$' : currency
      );
      setAdviceText(advice);
    } catch (err: any) {
      setAdviceText('Error al conectar con la IA de Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-[#080C14] border border-[#00E5FF]/30 shadow-md space-y-4 uf-glow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#FFFFFF]">Asesor Financiero IA</h3>
            <p className="text-[11px] text-[#94A3B8]">Recomendaciones tácticas con Gemini 2.5</p>
          </div>
        </div>

        <button
          onClick={handleGenerateAdvice}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#080C14] font-bold text-xs shadow-sm shadow-[#00E5FF]/20 transition-all disabled:opacity-40"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{adviceText ? 'Regenerar' : 'Consultar IA'}</span>
        </button>
      </div>

      {adviceText ? (
        <div className="p-3.5 rounded-xl bg-[#080C14] border border-[#94A3B8]/20 text-xs text-[#FFFFFF] leading-relaxed whitespace-pre-line font-['Inter']">
          {adviceText}
        </div>
      ) : (
        <p className="text-xs text-[#94A3B8] italic">
          Presiona "Consultar IA" para analizar tus ingresos y gastos actuales y recibir un informe ejecutivo personalizado.
        </p>
      )}
    </div>
  );
};
