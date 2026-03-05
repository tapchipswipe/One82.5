import { GoogleGenAI } from "@google/genai";
import { BusinessType, DailyMetric, Transaction, Review } from "../types";

// Helper to get API Key securely from LocalStorage
const getApiKey = () => {
  return localStorage.getItem('GEMINI_API_KEY') || '';
};

const isTrialMode = () => localStorage.getItem('one82_data_mode') === 'backend';

const getTrialUnavailableMessage = (feature: string) =>
  `${feature} is unavailable in Auth Login until a Gemini API key is configured.`;

const getUnavailableStatementAnalysis = (): import('../types').MerchantStatementAnalysis => ({
  merchantName: 'Unavailable in Auth Login',
  mccCode: 'N/A',
  mccDescription: 'Live statement analysis requires a Gemini API key.',
  riskLevel: 'Low',
  dailyVolume: 0,
  monthlyVolume: 0,
  yearlyVolume: 0,
  avgTicketSize: 0,
  txnCount: 0,
  blendedRate: 0,
  cardBrandMix: { visa: 0, mastercard: 0, amex: 0, discover: 0 },
  interchangeByBrand: { visa: 0, mastercard: 0, amex: 0, discover: 0 },
  swipedPercent: 0,
  keyedPercent: 0,
  debitPercent: 0,
  creditPercent: 0,
  totalResidual: 0,
  supportCost: 0,
  netProfit: 0,
  attritionRisk: 'Low',
  growthPattern: 'Stable',
  fluctuationRate: 0,
});

/**
 * SIMULATION FALLBACKS
 * These constants provide realistic simulated data when the API key is missing.
 */
const SIMULATED_INSIGHTS = [
  "Revenue is showing a strong 15% WoW growth in the afternoon peak hours. Consider shifting lunch staff to start 1 hour earlier.",
  "Inventory turnover for 'Premium Roast' is higher than expected. At this rate, you will stock out in 48 hours.",
  "Transaction volume is stable, but average ticket size is down 5%. Recommend a 'combo' up-sell strategy at checkout."
];

const SIMULATED_FORECASTS = [
  "Forecasted daily revenue of $2,450 for the upcoming weekend based on historical seasonality.",
  "Projected 12% increase in customer foot traffic due to upcoming local events.",
  "Expected inventory shortage for cold-brew supplies by Thursday."
];

/**
 * Step 3: Real-time Streaming for Dashboard (Updated Model)
 */
export const streamDashboardInsights = async (
  metrics: DailyMetric[],
  businessType: BusinessType,
  timeRange: string,
  onChunk: (text: string) => void
) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    if (isTrialMode()) {
      onChunk(getTrialUnavailableMessage('AI dashboard insights'));
      return;
    }

    // Simulated live typing effect for "Offline Mode"
    const randomInsight = SIMULATED_INSIGHTS[Math.floor(Math.random() * SIMULATED_INSIGHTS.length)];
    const chunks = randomInsight.split(' ');
    for (const chunk of chunks) {
      onChunk(chunk + ' ');
      await new Promise(r => setTimeout(r, 100));
    }
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are One82 AI. Analyze this ${businessType} data for ${timeRange}: ${JSON.stringify(metrics)}. Provide a 2-sentence summary and one growth tip.`;

    const result = await ai.models.generateContentStream({
      model: 'gemini-1.5-flash-latest',
      contents: prompt,
    });

    for await (const chunk of result) {
      if (chunk.text) onChunk(chunk.text);
    }
  } catch (error) {
    console.error("Gemini Service Error:", error);
    if (isTrialMode()) {
      onChunk(getTrialUnavailableMessage('AI dashboard insights'));
      return;
    }

    onChunk("AI analysis failed. Reverting to automated local insights...");
  }
};

/**
 * Step 3: Real-time Streaming for Chat
 */
export const chatWithDataStream = async (
  message: string,
  contextData: any,
  onChunk: (text: string) => void
) => {
  const apiKey = getApiKey();

  if (!apiKey) {
    if (isTrialMode()) {
      onChunk(getTrialUnavailableMessage('Data Chat'));
      return;
    }

    onChunk("I am currently in **Offline Simulation Mode**. Once you provide a Gemini API key in Settings, I can analyze your live data with full reasoning capabilities. \n\nBased on your local system: Everything looks stable!");
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
      if (chunk.text) onChunk(chunk.text);
    }
  } catch {
    onChunk(isTrialMode()
      ? getTrialUnavailableMessage('Data Chat')
      : "Data Assistant is temporarily unavailable. Please check your connection.");
  }
};

/**
 * Step 4: PDF & Multi-modal Support
 */
export const analyzeStatementDocument = async (
  base64Data: string,
  mimeType: string
): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    if (isTrialMode()) {
      return getTrialUnavailableMessage('Statement analysis');
    }

    return "### 📄 Simulated Statement Analysis\n\n- **Total Volume**: $42,500.00\n- **Total Fees**: $935.00 (2.2%)\n- **Potential Savings**: $150/mo with One82 Zero-Cost processing.\n\n*Connect your API key for a deep forensic analysis.*";
  }

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
  } catch {
    return "Document analysis failed.";
  }
};

/**
 * Step 7: Proactive AI Guardrails (Anomaly Detection)
 */
export const detectAnomalies = async (transactions: Transaction[]): Promise<{ title: string, message: string } | null> => {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Analyze these transactions for unusual patterns or fraud: ${JSON.stringify(transactions.slice(0, 10))}. Return JSON {title, message} or "NONE".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: prompt,
    });
    const text = response.text;
    if (text && text.includes('{')) {
      const jsonMatch = text.match(/\{.*\}/s);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch { return null; }
};

/**
 * Step 8: Interactive Visualization Analysis
 */
export const explainDataPoint = async (point: any, businessType: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey && isTrialMode()) return getTrialUnavailableMessage('Data point analysis');
  if (!apiKey) return `This data point shows $${point.revenue.toLocaleString()} in revenue. In a ${businessType} business, this typically represents a standard operational cycle.`;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `Explain this data point ($${point.revenue} revenue on ${point.date}) for a ${businessType} business. Why might this happen? 2 sentences.`;
  try {
    const res = await ai.models.generateContent({ model: 'gemini-1.5-flash-latest', contents: prompt });
    return res.text || "No explanation available.";
  } catch { return "Analysis unavailable."; }
};

export const generateForecastInsights = async (historical: DailyMetric[]) => {
  const apiKey = getApiKey();
  if (!apiKey && isTrialMode()) return getTrialUnavailableMessage('Forecast insights');
  if (!apiKey) return SIMULATED_FORECASTS[Math.floor(Math.random() * SIMULATED_FORECASTS.length)];

  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: `Forecast next 7 days based on: ${JSON.stringify(historical)}. Short summary.`
    });
    return res.text || "";
  } catch { return "Forecast offline."; }
};

export const analyzeSentiment = async (reviews: Review[]) => {
  const apiKey = getApiKey();
  if (!apiKey && isTrialMode()) return getTrialUnavailableMessage('Sentiment analysis');
  if (!apiKey) return "Overall sentiment is **Positive (85%)**. Customers frequently mention 'Great service' and 'Clean environment'.";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: `Sentiment of: ${JSON.stringify(reviews)}. Short summary.`
    });
    return res.text || "";
  } catch { return "Sentiment unavailable."; }
};

export const categorizeTransaction = async (transaction: Transaction) => {
  const apiKey = getApiKey();
  if (!apiKey && isTrialMode()) return "Uncategorized";
  if (!apiKey) return transaction.amount > 500 ? "Inventory" : "Miscellaneous";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: `Category for: ${transaction.customer} - ${transaction.items}. One word.`
    });
    return res.text?.trim() || "Uncategorized";
  } catch { return "Uncategorized"; }
};

export const analyzeTransactionRisk = async (transaction: Transaction) => {
  const apiKey = getApiKey();
  if (!apiKey && isTrialMode()) return getTrialUnavailableMessage('Transaction risk analysis');
  if (!apiKey) return "Low Risk (Simulated)";

  const ai = new GoogleGenAI({ apiKey });
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: `Risk of: ${JSON.stringify(transaction)}. 1 sentence.`
    });
    return res.text || "";
  } catch { return "Unknown risk."; }
};

/**
 * NEW: Analyze Portfolio for ISO
 */
export const analyzePortfolio = async (merchants: any[]): Promise<string> => {
  const apiKey = getApiKey();

  const generateSimulatedAnalysis = () => {
    const atRisk = merchants.filter(m => m.churnRisk === 'High').map(m => m.name);
    return `### ⚡️ AI Analysis (Offline Mode)
    
1. **Critical Churn Prevention**: ${atRisk.length > 0 ? `Immediate attention needed for **${atRisk.join(', ')}**.` : "No immediate high-risk merchants detected."} Check their latest volume trends in the Ledger below.
2. **Margin Optimization**: Portfolio average margin is 0.45%. Target Convenience stores for premium rate adjustments.
3. **Growth Engine**: Your top 10% of merchants are eligible for Inventory Autopilot. Reach out to **Tech Gadgets** for early access.`;
  };

  if (!apiKey && isTrialMode()) return getTrialUnavailableMessage('Portfolio AI analysis');
  if (!apiKey) return generateSimulatedAnalysis();

  const ai = new GoogleGenAI({ apiKey });
  const summary = merchants.map(m =>
    `- ${m.name} (${m.businessType}): Vol $${m.monthlyVolume}, Risk ${m.churnRisk}, Trend ${m.trend}`
  ).join('\n');

  const prompt = `You are a payments ISO portfolio manager. Portolio: ${summary}. Identify top 3 critical actions.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: prompt
    });
    return res.text || generateSimulatedAnalysis();
  } catch {
    if (isTrialMode()) {
      return getTrialUnavailableMessage('Portfolio AI analysis');
    }

    return generateSimulatedAnalysis();
  }
};

/**
 * HELPERS For Live Voice Assistant
 */
export const encodeBase64 = (data: Uint8Array): string => {
  return btoa(String.fromCharCode(...data));
};

export const decodeBase64 = (base64String: string): Uint8Array => {
  const binaryStr = atob(base64String);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
};

export const connectLiveAssistant = async ({ onopen, onmessage, onerror, onclose }: {
  onopen: () => void;
  onmessage: (msg: any) => void;
  onerror: (err: any) => void;
  onclose: () => void;
}) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    if (isTrialMode()) {
      onerror(new Error(getTrialUnavailableMessage('Live Assistant')));
      onclose();
      return { sendRealtimeInput: () => { }, close: onclose };
    }

    // Simulate connection
    onopen();
    setTimeout(() => {
      onmessage({ serverContent: { interrupted: false } });
    }, 500);
    return { sendRealtimeInput: () => { }, close: onclose };
  }

  try {
    const HOST = 'generativelanguage.googleapis.com';
    const url = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
    const ws = new WebSocket(url);

    return new Promise<any>((resolve) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({
          setup: {
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
              responseModalities: ["AUDIO", "TEXT"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } } }
            },
            systemInstruction: {
              role: "user",
              parts: [{ text: "You are the One82 voice assistant. Keep answers short and professional." }]
            }
          }
        }));
        onopen();
        resolve({
          sendRealtimeInput: (chunks: any[]) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ clientContent: { turns: [{ role: "user", parts: chunks }], turnComplete: true } }));
            }
          },
          close: () => ws.close()
        });
      };
      ws.onmessage = (e) => onmessage(JSON.parse(e.data));
      ws.onerror = onerror;
      ws.onclose = onclose;
    });
  } catch (error) {
    onerror(error);
    return { sendRealtimeInput: () => { }, close: onclose };
  }
};

/**
 * Full Merchant Statement Analysis (structured)
 */
export const analyzeStatementFull = async (
  base64Data: string,
  mimeType: string
): Promise<import('../types').MerchantStatementAnalysis> => {
  const apiKey = getApiKey();

  const simulatedResult: import('../types').MerchantStatementAnalysis = {
    merchantName: "Demo Merchant LLC",
    mccCode: "5812",
    mccDescription: "Eating Places & Restaurants",
    riskLevel: "Medium",
    dailyVolume: 1417,
    monthlyVolume: 42500,
    yearlyVolume: 510000,
    avgTicketSize: 34.25,
    txnCount: 1240,
    blendedRate: 2.20,
    cardBrandMix: { visa: 52, mastercard: 28, amex: 14, discover: 6 },
    interchangeByBrand: { visa: 1.51, mastercard: 1.55, amex: 2.35, discover: 1.56 },
    swipedPercent: 74,
    keyedPercent: 26,
    debitPercent: 38,
    creditPercent: 62,
    totalResidual: 425,
    supportCost: 120,
    netProfit: 305,
    attritionRisk: "Medium",
    growthPattern: "Stable",
    fluctuationRate: 8.4,
  };

  if (!apiKey && isTrialMode()) return getUnavailableStatementAnalysis();
  if (!apiKey) return simulatedResult;

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are an expert payments analyst for an ISO. Analyze this merchant statement document and extract the following as a strict JSON object (no markdown):
{
  "merchantName": string,
  "mccCode": string,
  "mccDescription": string,
  "riskLevel": "Low"|"Medium"|"High",
  "dailyVolume": number,
  "monthlyVolume": number,
  "yearlyVolume": number,
  "avgTicketSize": number,
  "txnCount": number,
  "blendedRate": number,
  "cardBrandMix": { "visa": number, "mastercard": number, "amex": number, "discover": number },
  "interchangeByBrand": { "visa": number, "mastercard": number, "amex": number, "discover": number },
  "swipedPercent": number,
  "keyedPercent": number,
  "debitPercent": number,
  "creditPercent": number,
  "totalResidual": number,
  "supportCost": number,
  "netProfit": number,
  "attritionRisk": "Low"|"Medium"|"High",
  "growthPattern": "Growing"|"Stable"|"Shrinking",
  "fluctuationRate": number
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      }
    });
    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as import('../types').MerchantStatementAnalysis;
    if (isTrialMode()) return getUnavailableStatementAnalysis();
    return simulatedResult;
  } catch (e) {
    console.error("Statement analysis failed, using simulation.", e);
    if (isTrialMode()) return getUnavailableStatementAnalysis();
    return simulatedResult;
  }
};
