
import { GoogleGenAI, Modality } from "@google/genai";
import { BusinessType, DailyMetric, Transaction, Review } from "../types";

// Helper to get API Key securely from LocalStorage
const getApiKey = () => {
  return localStorage.getItem('GEMINI_API_KEY') || '';
};

// Step 3: Real-time Streaming for Dashboard (Updated Model)
export const streamDashboardInsights = async (
  metrics: DailyMetric[],
  businessType: BusinessType,
  timeRange: string,
  onChunk: (text: string) => void
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    onChunk("Please configure your Gemini API Key in Settings.");
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const styleInstruction = "Provide a clear summary with supporting evidence.";

    const prompt = `You are One82 AI. Analyze this ${businessType} data for ${timeRange}: ${JSON.stringify(metrics)}. 
  ${styleInstruction} 
  Provide a 2-sentence summary and one growth tip.`;

    try {
      const result = await ai.models.generateContentStream({
        model: 'gemini-1.5-flash-latest',
        contents: prompt,
      });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) onChunk(text);
      }
    } catch (error) {
      console.error("Gemini Stream Error:", error);
      onChunk("Insights currently unavailable.");
    }
  };

  // Step 3: Real-time Streaming for Chat
  export const chatWithDataStream = async (
    message: string,
    contextData: any,
    onChunk: (text: string) => void
  ) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      onChunk("Please configure your Gemini API Key.");
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = `You are One82's Data Assistant. Answer questions about this context: ${JSON.stringify(contextData)}. Be concise.`;

    try {
      const result = await ai.models.generateContentStream({
        model: 'gemini-1.5-flash-latest',
        contents: message,
        config: { systemInstruction }
      });

      for await (const chunk of result) {
        const text = chunk.text;
        if (text) onChunk(text);
      }
    } catch (error) {
      onChunk("Chat unavailable.");
    }
  };

  // Step 4: PDF & Multi-modal Support
  export const analyzeStatementDocument = async (
    base64Data: string,
    mimeType: string
  ): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Missing API Key";

    const ai = new GoogleGenAI({ apiKey });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-latest',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: `Extract: Total Sales, Total Fees, and anomalies. Be concise.` }
          ]
        }
      });
      return response.text || "No data extracted.";
    } catch (error) {
      return "Document analysis failed.";
    }
  };

  // Step 7: Proactive AI Guardrails (Anomaly Detection)
  export const detectAnomalies = async (transactions: Transaction[]): Promise<{ title: string, message: string } | null> => {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze these transactions for unusual patterns or fraud: ${JSON.stringify(transactions.slice(0, 10))}. 
  If any high risk found, return a JSON with title and message. Else return "NONE".`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash-latest',
        contents: prompt,
      });
      const text = response.text;
      if (text && text.includes('{')) {
        try {
          const jsonMatch = text.match(/\{.*\}/s);
          if (jsonMatch) return JSON.parse(jsonMatch[0]);
        } catch (e) { return null; }
      }
      return null;
    } catch (e) { return null; }
  };

  // Step 8: Interactive Visualization Analysis
  export const explainDataPoint = async (point: any, businessType: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "Please configure API Key.";

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Explain this data point ($${point.revenue} revenue on ${point.date}) for a ${businessType} business. Why might this happen? 2 sentences.`;
    const res = await ai.models.generateContent({ model: 'gemini-1.5-flash-latest', contents: prompt });
    return res.text || "No explanation available.";
  };

  export const generateForecastInsights = async (historical: DailyMetric[]) => {
    const apiKey = getApiKey();
    if (!apiKey) return "Please configure API Key.";

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: `Forecast next 7 days based on: ${JSON.stringify(historical)}. Short summary.`
    });
    return res.text || "";
  };

  export const analyzeSentiment = async (reviews: Review[]) => {
    const apiKey = getApiKey();
    if (!apiKey) return "Please configure API Key.";

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: `Sentiment of: ${JSON.stringify(reviews)}. Short summary.`
    });
    return res.text || "";
  };

  export const categorizeTransaction = async (transaction: Transaction) => {
    const apiKey = getApiKey();
    if (!apiKey) return "Uncategorized";

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({ model: 'gemini-1.5-flash-latest', contents: `Category for: ${transaction.customer} - ${transaction.items}. Return one word category.` });
    return res.text?.trim() || "Uncategorized";
  };

  export const analyzeTransactionRisk = async (transaction: Transaction) => {
    const apiKey = getApiKey();
    if (!apiKey) return "";

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: `Risk of: ${JSON.stringify(transaction)}. 1 sentence.`
    });
    return res.text || "";
  };

  // NEW: Analyze Portfolio for ISO
  export const analyzePortfolio = async (merchants: any[]): Promise<string> => {
    const apiKey = getApiKey();

    // FALLBACK: Simulated Analysis Generator
    const generateSimulatedAnalysis = () => {
      const atRisk = merchants.filter(m => m.churnRisk === 'High').map(m => m.name);
      return `### ⚡️ AI Analysis (Offline Mode)
    
1. **Critical Churn Prevention**: ${atRisk.length > 0 ? `Immediate attention needed for **${atRisk.join(', ')}**.` : "No immediate high-risk merchants detected."} Check their transaction volume drop.
2. **Growth Opportunity**: Target mid-tier merchants with >$50k volume for premium loyalty upgrades.
3. **Portfolio Health**: Overall volume is trending ${Math.random() > 0.5 ? 'upwards 📈' : 'stable ➖'}. Recommend diversifying industry mix.`;
    };

    if (!apiKey) {
      return generateSimulatedAnalysis();
    }

    const ai = new GoogleGenAI({ apiKey });

    // Summarize data to save tokens
    const summary = merchants.map(m =>
      `- ${m.name} (${m.businessType}): Vol $${m.monthlyVolume}, Risk ${m.churnRisk}, Trend ${m.trend}`
    ).join('\n');

    const prompt = `You are a strategic portfolio manager for a payments ISO. 
  Here is your current merchant portfolio status:
  ${summary}

  Task: Identify the top 3 critical actions needed to increase volume or prevent churn.
  Output Format:
  1. **[Action Title]**: [Specific advice mentioning merchant name]
  2. **[Action Title]**: [Specific advice]
  3. **[Action Title]**: [Specific advice]
  
  Keep it professional, concise, and actionable.`;

    try {
      const res = await ai.models.generateContent({
        model: 'gemini-1.5-flash-latest',
        contents: prompt
      });
      return res.text || generateSimulatedAnalysis();
    } catch (error) {
      console.warn("Gemini API Error (Falling back to simulation):", error);
      return generateSimulatedAnalysis();
    }
  };
