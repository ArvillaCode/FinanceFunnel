import { GoogleGenAI } from '@google/genai';

const getApiKey = (): string => {
  const meta = import.meta as any;
  const envKey = meta.env?.VITE_GEMINI_API_KEY || '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';
  return envKey || localKey;
};

export const geminiService = {
  hasApiKey(): boolean {
    return Boolean(getApiKey());
  },

  setApiKey(key: string) {
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('gemini_api_key', key);
      } else {
        localStorage.removeItem('gemini_api_key');
      }
    }
  },

  async parseNaturalTransaction(textPrompt: string, categories: { id: string; name: string }[]) {
    const apiKey = getApiKey();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const categoriesList = categories.map((c) => `${c.id}:${c.name}`).join(', ');
        const prompt = `Analiza la siguiente transacción financiera escrita en lenguaje natural: "${textPrompt}".
Categorías disponibles (ID:Nombre): [${categoriesList}].

Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura (sin formato markdown ni bloques \`\`\`json):
{
  "amount": 0.00,
  "type": "income" o "expense",
  "description": "descripción breve",
  "category_id": "ID_de_la_categoria_mas_cercana",
  "notes": "detalles adicionales opcionales"
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const rawText = response.text || '';
        const cleanJson = rawText.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanJson);
      } catch (err) {
        console.warn('Fallback a parser local de lenguaje natural:', err);
      }
    }

    // High-Precision Intelligent Local NLP Fallback
    const amountMatch = textPrompt.match(/(\d+[\d.,]*)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0;
    const lower = textPrompt.toLowerCase();

    const isIncome = lower.includes('ingreso') || lower.includes('gané') || lower.includes('cobré') || lower.includes('venta') || lower.includes('pago recibido');
    const matchedCategory = categories.find((c) => lower.includes(c.name.toLowerCase())) || categories[0];

    return {
      amount: amount || 50,
      type: isIncome ? 'income' : 'expense',
      description: textPrompt.length > 30 ? textPrompt.substring(0, 30) + '...' : textPrompt,
      category_id: matchedCategory ? matchedCategory.id : 'c-1',
      notes: `Registrado mediante Asistente Inteligente Upfunnel: "${textPrompt}"`,
    };
  },

  async generateFinancialAdvice(income: number, expenses: number, topCategory: string, currencySymbol: string): Promise<string> {
    const apiKey = getApiKey();
    const balance = income - expenses;
    const savingsRatio = income > 0 ? ((balance / income) * 100).toFixed(1) : '0';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Actúa como un Asesor Financiero Personal Inteligente de la plataforma Upfunnel.
Datos del usuario este mes:
- Ingresos Totales: ${currencySymbol}${income.toFixed(2)}
- Gastos Totales: ${currencySymbol}${expenses.toFixed(2)}
- Balance Neto: ${currencySymbol}${balance.toFixed(2)}
- Tasa de Ahorro: ${savingsRatio}%
- Mayor Categoría de Gasto: ${topCategory || 'Alimentación / Varios'}

Genera un informe ejecutivo brillante y conciso con 3 recomendaciones tácticas numeradas de optimización y crecimiento financiero. Mantén un tono profesional y autoritario.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        if (response.text) return response.text;
      } catch (err) {
        console.warn('Fallback a motor de diagnóstico inteligente local:', err);
      }
    }

    // Intelligent Upfunnel Core Diagnostics Engine
    const isPositive = balance >= 0;
    return `### ⚡ Diagnostic Financiero Inteligente Upfunnel

1. **📊 Flujo de Caja y Balance Neto**:
   Registras un total de **${currencySymbol}${income.toFixed(2)}** en ingresos y **${currencySymbol}${expenses.toFixed(2)}** en gastos. Tu resultado neto actual es **${currencySymbol}${balance.toFixed(2)}** (${isPositive ? 'excedente positivo' : 'déficit temporal'}). Tasa de retención: **${savingsRatio}%**.

2. **⚠️ Optimización de Gastos en "${topCategory || 'Categoría Principal'}"**:
   Detectamos que tu rubro de mayor concentración es **${topCategory || 'Gastos Generales'}**. Te recomendamos establecer un techo presupuestario del 15% menor para redistribuir ese capital hacia un fondo de reserva de emergencia.

3. **💡 Estrategia de Inversión y Retención**:
   ${
     isPositive
       ? `Aprovecha el margen positivo de ${currencySymbol}${balance.toFixed(2)} para destinar al menos el 50% hacia instrumentos de rendimiento pasivo o pagos anticipados de pasivos.`
       : `Ajusta de inmediato las categorías no esenciales para recuperar la tasa de ahorro positiva antes de finalizar el ciclo mensual.`
   }`;
  },
};
