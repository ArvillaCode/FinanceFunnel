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
    if (!apiKey) {
      throw new Error('API Key de Gemini no configurada. Añade tu clave en Configuración.');
    }

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
  },

  async generateFinancialAdvice(income: number, expenses: number, topCategory: string, currencySymbol: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
      return 'Configura tu clave API de Gemini en Configuración para activar el Asesor Financiero con IA.';
    }

    const ai = new GoogleGenAI({ apiKey });
    const balance = income - expenses;
    const prompt = `Actúa como un Asesor Financiero Personal Inteligente de la plataforma Upfunnel.
Datos del usuario este mes:
- Ingresos: ${currencySymbol}${income.toFixed(2)}
- Gastos: ${currencySymbol}${expenses.toFixed(2)}
- Balance Neto: ${currencySymbol}${balance.toFixed(2)}
- Mayor Categoría de Gasto: ${topCategory || 'N/A'}

Genera un informe ejecutivo breve de 3 puntos clave con consejos tácticos de ahorro e inversión. Mantén un tono técnico, autoritario y directo.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || 'No se pudo generar la recomendación.';
  },
};
