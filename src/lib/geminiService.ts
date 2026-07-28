import { GoogleGenAI } from '@google/genai';

const getApiKey = (): string => {
  const meta = import.meta as any;
  const envKey =
    meta.env?.VITE_GEMINI_API_KEY ||
    meta.env?.NEXT_PUBLIC_GEMINI_API_KEY ||
    meta.env?.GEMINI_API_KEY ||
    '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';
  return envKey || localKey;
};

async function generateContentWithFallback(ai: GoogleGenAI, prompt: string): Promise<string | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({ model, contents: prompt });
      if (response && response.text) return response.text;
    } catch (err) {
      console.warn(`Modelo ${model} no disponible, intentando siguiente:`, err);
    }
  }
  return null;
}

export interface ContextualFinancialData {
  income: number;
  expenses: number;
  balance: number;
  savingsRatio: string;
  topCategories: { name: string; total: number; percentage: number }[];
  transactionCount: number;
  currencySymbol: string;
  recentTransactionsCount?: number;
}

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
  "category_id": "id de la categoría correspondiente",
  "transaction_date": "YYYY-MM-DD"
}`;

        const resText = await generateContentWithFallback(ai, prompt);
        if (resText) {
          const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleanJson);
        }
      } catch (err) {
        console.warn('Error parseando con Gemini API:', err);
      }
    }

    // Rule-based Fallback Parser
    const amountMatch = textPrompt.match(/(\$|\b)(\d+([.,]\d+)?)/);
    const amount = amountMatch ? parseFloat(amountMatch[2].replace(',', '.')) : 0;
    const isIncome = /ingreso|ganancia|cobro|pago recibido|venta|salario|sueldo/i.test(textPrompt);

    let matchedCategoryId = categories[0]?.id || 'cat-1';
    for (const cat of categories) {
      if (new RegExp(cat.name, 'i').test(textPrompt)) {
        matchedCategoryId = cat.id;
        break;
      }
    }

    return {
      amount,
      type: isIncome ? ('income' as const) : ('expense' as const),
      description: textPrompt,
      category_id: matchedCategoryId,
      transaction_date: new Date().toISOString().slice(0, 10),
    };
  },

  async generateExpressDiagnosis(data: ContextualFinancialData): Promise<string> {
    const apiKey = getApiKey();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Actúa como un Asesor Financiero Senior de la plataforma Upfunnel. Genera un Diagnóstico Express conciso (máximo 3 párrafos breves) con emojis en formato Markdown.

Datos Financieros Actuales:
- Ingresos Totales: ${data.currencySymbol}${data.income.toFixed(2)}
- Gastos Totales: ${data.currencySymbol}${data.expenses.toFixed(2)}
- Balance Neto: ${data.currencySymbol}${data.balance.toFixed(2)}
- Tasa de Ahorro: ${data.savingsRatio}%
- Transacciones Registradas: ${data.transactionCount}
- Categorías Principales de Gasto: ${data.topCategories.map((c) => `${c.name} (${data.currencySymbol}${c.total.toFixed(2)} / ${c.percentage.toFixed(0)}%)`).join(', ')}

Dame un diagnóstico de alto impacto resaltando fortalezas y la principal oportunidad de mejora.`;

        const resText = await generateContentWithFallback(ai, prompt);
        if (resText) return resText;
      } catch (err) {
        console.warn('Fallback a diagnóstico local:', err);
      }
    }

    // Smart Rule-Based Express Diagnosis
    const isHealthy = data.balance >= 0;
    const topCatName = data.topCategories[0]?.name || 'Generales';

    return `### ⚡ Diagnóstico Express Inteligente Upfunnel
* **Estado del Flujo**: ${isHealthy ? '🟢 **Superávit Saludable**' : '🔴 **Déficit Operativo**'}
* **Tasa de Retención**: Tu tasa de ahorro estimada es del **${data.savingsRatio}%**.
* **Foco de Atención**: Tu mayor concentración de gastos se encuentra en **${topCatName}** (${data.topCategories[0]?.percentage.toFixed(0) || 0}% del total).

💡 *Recomendación clave*: ${isHealthy ? 'Destina el excedente a inversiones de alta liquidez.' : 'Reduce los gastos en tu categoría principal para restablecer el equilibrio.'}`;
  },

  async generateDetailedAudit(data: ContextualFinancialData): Promise<string> {
    const apiKey = getApiKey();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Genera una Auditoría Financiera Profesional Completa de la cuenta Upfunnel.

Estadísticas del Usuario:
- Ingresos: ${data.currencySymbol}${data.income.toFixed(2)}
- Gastos: ${data.currencySymbol}${data.expenses.toFixed(2)}
- Balance Neto: ${data.currencySymbol}${data.balance.toFixed(2)}
- Tasa de Retención: ${data.savingsRatio}%
- Transacciones: ${data.transactionCount}
- Top Categorías: ${JSON.stringify(data.topCategories)}

Estructura la respuesta en:
1. Salud Financiera (Semáforo)
2. Hallazgos y Patrones de Consumo
3. Proyección Predictiva a 30 Días
4. Plan de Acción de 3 Pasos`;

        const resText = await generateContentWithFallback(ai, prompt);
        if (resText) return resText;
      } catch (err) {
        console.warn('Fallback a auditoría local:', err);
      }
    }

    // Smart Local Audit Generator
    const categoriesFormatted = data.topCategories
      .map((c) => `- **${c.name}**: ${data.currencySymbol}${c.total.toFixed(2)} (${c.percentage.toFixed(0)}%)`)
      .join('\n');

    const isPositive = data.balance >= 0;
    return `### 🏆 Estado General de Salud Financiera
Salud Financiera: **${isPositive ? 'EXCELENTE (Semáforo Verde)' : 'EN ATENCIÓN (Semáforo Amarillo)'}**
Procesaste **${data.transactionCount} transacciones**. Tasa de retención del capital: **${data.savingsRatio}%**.

### 🔍 Hallazgos y Patrones de Consumo
${categoriesFormatted ? categoriesFormatted : 'Registros equilibrados sin concentraciones críticas de riesgo.'}

### 🔮 Proyección Predictiva a 30 Días
Si mantienes la tasa de gasto actual, el flujo neto proyectado para el próximo ciclo mensual será de aprox. **${data.currencySymbol}${(data.balance * 1.05).toFixed(2)}**.

### 🎯 Plan de Acción de 3 Pasos
1. **Paso 1**: Limita gastos no esenciales en tu categoría principal a un máximo del 30% del presupuesto.
2. **Paso 2**: Transfiere el excedente positivo de **${data.currencySymbol}${Math.max(0, data.balance).toFixed(2)}** a una cuenta de liquidez inmediata.
3. **Paso 3**: Revisa semanalmente el reporte en el DataCenter para mantener la trazabilidad.`;
  },

  async askFinancialQuestion(question: string, data: ContextualFinancialData): Promise<string> {
    const apiKey = getApiKey();

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Eres el Asistente Inteligente Financiero de Upfunnel Finance. Responde a la siguiente consulta del usuario con un tono profesional, empático y natural.

Contexto Financiero Actual del Usuario:
- Ingresos: ${data.currencySymbol}${data.income.toFixed(2)}
- Gastos: ${data.currencySymbol}${data.expenses.toFixed(2)}
- Balance Neto: ${data.currencySymbol}${data.balance.toFixed(2)}
- Tasa de Ahorro: ${data.savingsRatio}%
- Principales Categorías: ${data.topCategories.map((c) => `${c.name} (${c.percentage.toFixed(0)}%)`).join(', ')}

Consulta del Usuario: "${question}"`;

        const resText = await generateContentWithFallback(ai, prompt);
        if (resText) return resText;
      } catch (err) {
        console.warn('Fallback a respuesta de chat inteligente local:', err);
      }
    }

    // Smart Local Conversational Engine for Greetings & Questions
    const lower = question.trim().toLowerCase();
    const isGreeting = /^(hola|buenas|saludos|hello|hi|buenos dias|buenas noches|buenas tardes)/i.test(lower);

    if (isGreeting) {
      return `¡Hola! 👋 Bienvenido a tu **Asistente Financiero Inteligente Upfunnel**.

Actualmente registras **${data.currencySymbol}${data.income.toFixed(2)}** en ingresos y **${data.currencySymbol}${data.expenses.toFixed(2)}** en gastos, con un balance positivo de **${data.currencySymbol}${data.balance.toFixed(2)}** este mes.

¿En qué puedo ayudarte hoy? Puedes preguntarme:
- *¿En qué categoría estoy gastando más?*
- *¿Cómo puedo mejorar mi tasa de ahorro del ${data.savingsRatio}%?*
- *¿Cuál es la proyección de mi flujo de caja?*`;
    }

    if (lower.includes('categor') || lower.includes('gasta') || lower.includes('gasto')) {
      const top = data.topCategories[0];
      const topName = top ? top.name : 'General';
      const topAmt = top ? top.total : 0;
      const topPct = top ? top.percentage.toFixed(0) : '0';

      return `### 📊 Categoría con Mayor Gasto
Tu categoría con mayor nivel de gasto este mes es **${topName}**, acumulando **${data.currencySymbol}${topAmt.toFixed(2)}** (representando el **${topPct}%** de tus gastos totales).

**Recomendaciones de Optimización**:
- Revisa las transacciones registradas en **${topName}** para detectar consumos prescindibles.
- Asigna un límite en el módulo de Presupuestos para esta categoría.
- Tu balance acumulado disponible actual es de **${data.currencySymbol}${data.balance.toFixed(2)}**.`;
    }

    if (lower.includes('ahorro') || lower.includes('proyecc') || lower.includes('flujo')) {
      return `### 🔮 Análisis de Tasa de Ahorro y Proyección
* **Tasa de Ahorro Actual**: **${data.savingsRatio}%** de tus ingresos totales (${data.currencySymbol}${data.income.toFixed(2)}).
* **Saldo Neto Actual**: **${data.currencySymbol}${data.balance.toFixed(2)}**.
* **Proyección a 30 Días**: Manteniendo la tasa actual, tu disponible proyectado al cierre del ciclo será de aprox. **${data.currencySymbol}${(data.balance * 1.05).toFixed(2)}**.`;
    }

    return `### 💡 Respuesta Asistida Upfunnel
Analizando tus ingresos de **${data.currencySymbol}${data.income.toFixed(2)}** y gastos de **${data.currencySymbol}${data.expenses.toFixed(2)}** respecto a tu consulta **"${question}"**:

Te sugerimos monitorear tus categorías principales (**${data.topCategories.slice(0, 2).map((c) => c.name).join(', ') || 'Generales'}**) para optimizar tu flujo mensual y mantener tu saldo en **${data.currencySymbol}${data.balance.toFixed(2)}**.`;
  },
};
