import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  Key,
  Send,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Plus,
  Trash2,
  MessageSquare,
  User,
  RefreshCw,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { geminiService, ContextualFinancialData } from '../../lib/geminiService';

// --- MARKDOWN RENDERER COMPONENT ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const parseFormattedText = (text: string) => {
    // Replace **bold** with highlighted strong tag and *italic* with em tag
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="text-[#00E5FF] font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
        return (
          <em key={idx} className="text-slate-300 italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-slate-300">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      elements.push(
        <h3
          key={index}
          className="text-xs sm:text-sm font-black text-[#00E5FF] mt-3 mb-2 flex items-center gap-2 border-b border-[#00E5FF]/20 pb-1 uppercase tracking-wider uf-glow-sm"
        >
          <span>{trimmed.replace(/^###\s+/, '')}</span>
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-slate-300">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      elements.push(
        <h2 key={index} className="text-sm font-extrabold text-white mt-4 mb-2 border-b border-[#00E5FF]/30 pb-1">
          {trimmed.replace(/^##\s+/, '')}
        </h2>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      const text = trimmed.replace(/^[-*]\s+/, '');
      listItems.push(
        <li key={`li-${index}`} className="text-xs leading-relaxed text-slate-200">
          {parseFormattedText(text)}
        </li>
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      inList = true;
      const text = trimmed.replace(/^\d+\.\s+/, '');
      listItems.push(
        <li key={`li-${index}`} className="text-xs leading-relaxed text-slate-200">
          {parseFormattedText(text)}
        </li>
      );
    } else if (trimmed === '') {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-slate-300">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${index}`} className="list-disc list-inside space-y-1.5 my-2 pl-2 text-slate-300">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      elements.push(
        <p key={index} className="text-xs leading-relaxed text-slate-200 my-1 font-sans">
          {parseFormattedText(trimmed)}
        </p>
      );
    }
  });

  if (inList) {
    elements.push(
      <ul key="list-final" className="list-disc list-inside space-y-1.5 my-2 pl-2 text-slate-300">
        {listItems}
      </ul>
    );
  }

  return <div className="space-y-2">{elements}</div>;
};

// --- CHAT SESSION TYPES ---
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
}

const DEFAULT_GREETING = `¡Hola! 👋 Bienvenido a tu **Asistente Financiero Inteligente Upfunnel**.

Puedo ayudarte a auditar tu flujo de efectivo, proyectar tus finanzas a 30 días o resolver cualquier duda sobre tus transacciones. ¿En qué te gustaría enfocarte hoy?`;

export const AiAdviceWidget: React.FC = () => {
  const { filteredTransactions, categories, currency, addToast } = useFinance();

  // Multi-Session State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('finance_ai_sessions');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {}
      }
    }
    return [
      {
        id: `session-default-${Date.now()}`,
        title: 'Sesión Principal',
        messages: [
          {
            id: 'msg-init',
            sender: 'ai',
            text: DEFAULT_GREETING,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ],
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session-${Date.now()}`;
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Procesando datos financieros...');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const hasKey = geminiService.hasApiKey();

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll to bottom on new message or loading state change
  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isLoading]);

  // Save sessions to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('finance_ai_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;
  const savingsRatio = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0';

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

  // Add Message to Active Session
  const addMessageToActiveSession = (sender: 'user' | 'ai', text: string) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === activeSessionId) {
          const isFirstUserMsg = s.messages.filter((m) => m.sender === 'user').length === 0;
          const updatedTitle =
            isFirstUserMsg && sender === 'user'
              ? text.length > 22
                ? text.substring(0, 22) + '...'
                : text
              : s.title;

          return {
            ...s,
            title: updatedTitle,
            messages: [...s.messages, newMsg],
          };
        }
        return s;
      })
    );
  };

  // Create New Session
  const handleCreateNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Sesión #${sessions.length + 1}`,
      messages: [
        {
          id: `msg-init-${Date.now()}`,
          sender: 'ai',
          text: DEFAULT_GREETING,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newId);
    addToast({ type: 'info', title: 'Nueva Sesión', message: 'Se ha iniciado un nuevo hilo de conversación.' });
  };

  // Delete Active Session
  const handleDeleteSession = (sessionIdToDelete: string) => {
    if (sessions.length <= 1) {
      addToast({ type: 'warning', title: 'Sesión Única', message: 'No puedes eliminar la única sesión activa.' });
      return;
    }

    const filtered = sessions.filter((s) => s.id !== sessionIdToDelete);
    setSessions(filtered);
    if (activeSessionId === sessionIdToDelete) {
      setActiveSessionId(filtered[0].id);
    }
  };

  // Dynamic Loading Messages
  const runLoadingSequence = (type: 'express' | 'audit' | 'forecast' | 'question') => {
    setIsLoading(true);
    const msgs =
      type === 'express'
        ? [
            'Conectando con motor de Inteligencia Artificial Gemini 2.5...',
            'Procesando balance y 200+ transacciones...',
            'Generando diagnóstico express de alto impacto...',
          ]
        : type === 'audit'
        ? [
            'Iniciando Auditoría Financiera Profesional...',
            'Sintetizando patrones de consumo y desgloses de categorías...',
            'Calculando proyecciones y semáforos de salud financiera...',
          ]
        : [
            'Consultando modelo inteligente Upfunnel...',
            'Analizando contexto financiero del usuario...',
            'Formulando respuesta asistida...',
          ];

    let idx = 0;
    setLoadingMessage(msgs[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % msgs.length;
      setLoadingMessage(msgs[idx]);
    }, 900);

    return () => clearInterval(interval);
  };

  const handleGenerateExpressAdvice = async () => {
    const clearSeq = runLoadingSequence('express');
    try {
      const advice = await geminiService.generateExpressDiagnosis(getFinancialContext());
      addMessageToActiveSession('ai', advice);
    } catch (err) {
      addMessageToActiveSession('ai', 'Error al procesar el diagnóstico financiero.');
    } finally {
      clearSeq();
      setIsLoading(false);
    }
  };

  const handleGenerateFullAudit = async () => {
    const clearSeq = runLoadingSequence('audit');
    try {
      const audit = await geminiService.generateDetailedAudit(getFinancialContext());
      addMessageToActiveSession('ai', audit);
    } catch (err) {
      addMessageToActiveSession('ai', 'Error al ejecutar la auditoría financiera.');
    } finally {
      clearSeq();
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async (userQuestion?: string) => {
    const query = userQuestion || customPrompt;
    if (!query.trim()) return;

    addMessageToActiveSession('user', query);
    if (!userQuestion) setCustomPrompt('');

    const clearSeq = runLoadingSequence('question');
    try {
      const answer = await geminiService.askFinancialQuestion(query, getFinancialContext());
      addMessageToActiveSession('ai', answer);
    } catch (err) {
      addMessageToActiveSession('ai', 'Error al procesar tu consulta financiera.');
    } finally {
      clearSeq();
      setIsLoading(false);
    }
  };

  const handleSaveApiKey = () => {
    geminiService.setApiKey(apiKeyInput.trim());
    setShowKeyInput(false);
    addToast({
      type: 'success',
      title: 'Clave Configurada',
      message: apiKeyInput.trim()
        ? 'Clave de Gemini 2.5 Flash API activada.'
        : 'Usando Motor de Diagnóstico Inteligente Upfunnel.',
    });
  };

  return (
    <div className="p-6 rounded-3xl bg-[#080C14] border border-[#00E5FF]/40 shadow-2xl space-y-5 uf-glow-sm relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#94A3B8]/15 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/40 flex items-center justify-center uf-glow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-[#FFFFFF]">Asesor Inteligente IA</h3>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                  hasKey
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-600/40'
                    : 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30'
                }`}
              >
                {hasKey ? '✨ Gemini 2.5 Flash API' : 'Motor Diagnóstico Upfunnel'}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Auditoría financiera, análisis predictivo de 200+ transacciones e hilos multisesión en tiempo real
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

      {/* Multi-Session Selector Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                activeSessionId === s.id
                  ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] uf-glow-sm'
                  : 'bg-[#080C14] border-[#94A3B8]/20 text-[#94A3B8] hover:text-[#FFFFFF]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="truncate max-w-[130px]">{s.title}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCreateNewSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/40 text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#080C14] text-xs font-extrabold uppercase transition-all uf-glow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Sesión</span>
          </button>

          {sessions.length > 1 && (
            <button
              onClick={() => handleDeleteSession(activeSessionId)}
              className="p-1.5 rounded-xl bg-[#080C14] border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all"
              title="Eliminar esta sesión"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Triggers */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleGenerateExpressAdvice}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#94A3B8]/30 bg-[#080C14] text-[#94A3B8] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 text-xs font-bold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Diagnóstico Express</span>
        </button>

        <button
          onClick={handleGenerateFullAudit}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#94A3B8]/30 bg-[#080C14] text-[#94A3B8] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 text-xs font-bold transition-all"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Auditoría Completa</span>
        </button>

        <button
          onClick={() => handleAskQuestion('¿Cuál es la proyección de flujo de caja para los próximos 30 días?')}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#94A3B8]/30 bg-[#080C14] text-[#94A3B8] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 text-xs font-bold transition-all"
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Pronóstico 30 Días</span>
        </button>
      </div>

      {/* API Key Modal Input */}
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

      {/* Chat Messages Container */}
      <div className="max-h-[380px] overflow-y-auto space-y-3.5 p-3 rounded-2xl bg-[#080C14]/80 border border-[#94A3B8]/15">
        {activeSession?.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/40 text-[#00E5FF] flex items-center justify-center shrink-0 uf-glow-sm">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] p-4 rounded-2xl text-xs space-y-1 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-white rounded-tr-none'
                  : 'bg-[#080C14] border border-[#00E5FF]/30 text-white rounded-tl-none uf-glow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-4 border-b border-[#94A3B8]/10 pb-1 mb-1.5 text-[10px]">
                <span className="font-extrabold uppercase text-[#00E5FF]">
                  {msg.sender === 'user' ? 'Tú (Consulta)' : 'Asistente Upfunnel IA'}
                </span>
                <span className="text-[#94A3B8] font-mono">{msg.timestamp}</span>
              </div>

              {msg.sender === 'user' ? (
                <p className="leading-relaxed font-sans">{msg.text}</p>
              ) : (
                <MarkdownRenderer content={msg.text} />
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Elegant Ultra-Premium FinanceFunnel AI Neon Loading State */}
        {isLoading && (
          <div className="p-6 rounded-2xl bg-[#080C14] border border-[#00E5FF]/50 shadow-2xl uf-glow flex flex-col items-center justify-center gap-3 text-center relative overflow-hidden my-2">
            <div className="relative z-10 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-[#080C14] border-2 border-[#00E5FF] flex items-center justify-center uf-glow animate-bounce">
                <Sparkles className="w-6 h-6 text-[#00E5FF] animate-spin" />
              </div>
            </div>
            <div className="relative z-10 space-y-0.5">
              <h4 className="text-xs font-black text-[#FFFFFF] tracking-wider uppercase flex items-center justify-center gap-2">
                <span>Procesando Inteligencia Financiera</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#00E5FF] animate-ping" />
              </h4>
              <p className="text-[11px] text-[#00E5FF] font-mono animate-pulse">{loadingMessage}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Interactive Input Form */}
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
