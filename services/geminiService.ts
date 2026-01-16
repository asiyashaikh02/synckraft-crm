
import { GoogleGenAI } from "@google/genai";

/**
 * Fetches sales outreach advice using Gemini 3 Flash.
 * Creates a new instance on each call to ensure the latest API key is used.
 */
export const getSalesAdvice = async (leadName: string, value: number) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a brief 3-step outreach strategy for a new lead: ${leadName} with a potential contract value of $${value}. Keep it professional and concise.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Unable to generate advice at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Assistant is currently offline.";
  }
};

/**
 * Fetches operations optimization tips using Gemini 3 Flash.
 * Creates a new instance on each call to ensure the latest API key is used.
 */
export const getOperationsOptimization = async (company: string, stage: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide 2 quick tips to move ${company} from the ${stage} stage to the next stage faster in an execution workflow.`,
      config: {
        temperature: 0.5,
      }
    });
    return response.text || "No optimization tips available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Assistant is currently offline.";
  }
};
