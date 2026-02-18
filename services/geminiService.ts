
import { GoogleGenAI, Modality } from "@google/genai";
import { BusinessType, DailyMetric, Transaction, Review } from "../types";
import { StorageService } from "./storage";

// Helper for Base64/Uint8Array
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Get user preference for prompt tuning
const getAIStyleInstruction = () => {
  const style = StorageService.getSettings().aiResponseStyle;
  if (style < 30) {
    return "Your style is SIMPLIFIED. Avoid technical jargon. Use plain English. Focus on one high-level takeaway. Do not list many numbers.";
  } else if (style > 70) {
    return "Your style is DATA-DRIVEN. Use specific metrics, percentages, and financial terminology. Look for correlations between specific transaction types and revenue. Be granular and analytical.";
  }
  return "Your style is BALANCED. Provide a clear summary with supporting evidence.";
};

// Step 3: Real-time Streaming for Dashboard
export const streamDashboardInsights = async (
  metrics: DailyMetric[],
  businessType: BusinessType,
  timeRange: string,
  onChunk: (text: string) => void
) => {
  // Fix: Instantiate GoogleGenAI right before making an API call to ensure latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  const prompt = `You are One82 AI. Analyze this ${businessType} data for ${timeRange}: ${JSON.stringify(metrics)}. 
  ${styleInstruction} 
  Provide a 2-sentence summary and one growth tip.`;
  
  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    let fullText = "";
    for await (const chunk of result) {
      // Fix: Access the .text property directly (not a method)
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
  } catch (error) {
    onChunk("Insights currently unavailable.");
  }
};

// Step 3: Real-time Streaming for Chat
export const chatWithDataStream = async (
  message: string,
  contextData: any,
  onChunk: (text: string) => void
) => {
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  const systemInstruction = `You are One82's Data Assistant. ${styleInstruction} Answer questions about this context: ${JSON.stringify(contextData)}. Be concise.`;
  
  try {
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: { systemInstruction }
    });

    let fullText = "";
    for await (const chunk of result) {
      // Fix: Access the .text property directly
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
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
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  try {
    const response = await ai.models.generateContent({
      // Fix: Use gemini-3-flash-preview for complex multimodal extraction tasks
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: `Extract: Total Sales, Total Fees, and anomalies. ${styleInstruction} Be concise.` }
        ]
      }
    });
    // Fix: Access the .text property directly
    return response.text || "No data extracted.";
  } catch (error) {
    return "Document analysis failed.";
  }
};

// Step 5: Gemini Live Session
export const connectLiveAssistant = (callbacks: any) => {
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: `You are One82 Voice Assistant. ${styleInstruction} Help the user understand their business metrics via voice conversation.`,
    },
  });
};

// Step 7: Proactive AI Guardrails (Anomaly Detection)
export const detectAnomalies = async (transactions: Transaction[]): Promise<{title: string, message: string} | null> => {
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  const prompt = `Analyze these transactions for unusual patterns or fraud: ${JSON.stringify(transactions.slice(0, 10))}. 
  ${styleInstruction} 
  If any high risk found, return a JSON with title and message. Else return "NONE".`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Access the .text property directly
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
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  const prompt = `Explain this data point ($${point.revenue} revenue on ${point.date}) for a ${businessType} business. ${styleInstruction} Why might this happen? 2 sentences.`;
  const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
  // Fix: Access the .text property directly
  return res.text || "No explanation available.";
};

export const generateForecastInsights = async (historical: DailyMetric[]) => {
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Forecast next 7 days based on: ${JSON.stringify(historical)}. ${styleInstruction} Short summary.` 
  });
  // Fix: Access the .text property directly
  return res.text || "";
};

export const analyzeSentiment = async (reviews: Review[]) => {
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Sentiment of: ${JSON.stringify(reviews)}. ${styleInstruction} Short summary.` 
  });
  // Fix: Access the .text property directly
  return res.text || "";
};

export const categorizeTransaction = async (transaction: Transaction) => {
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const res = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Category for: ${transaction.customer} - ${transaction.items}. Return one word category.` });
  // Fix: Access the .text property directly
  return res.text?.trim() || "Uncategorized";
};

export const analyzeTransactionRisk = async (transaction: Transaction) => {
  // Fix: Instantiate GoogleGenAI right before making an API call
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const styleInstruction = getAIStyleInstruction();
  const res = await ai.models.generateContent({ 
    model: 'gemini-3-flash-preview', 
    contents: `Risk of: ${JSON.stringify(transaction)}. ${styleInstruction} 1 sentence.` 
  });
  // Fix: Access the .text property directly
  return res.text || "";
};
