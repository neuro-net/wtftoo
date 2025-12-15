import { GoogleGenAI } from "@google/genai";
import { DailyLog } from "../types";
import { BENZO_DATA } from "../constants";

export const generateHealthInsight = async (logs: DailyLog[]) => {
  try {
    // We strictly follow the "Runtime" instructions: no checking for API key presence in UI code.
    // It is assumed to be in process.env.API_KEY.
    // We add || '' to satisfy TypeScript strict null checks, though the key should be injected by Vite.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    // Prepare data summary for the last 7 days
    const recentLogs = logs.slice(0, 7);
    const summary = recentLogs.map(log => {
        // Calculate daily total diazepam equivalent for the AI context
        let dailyDiazepamEq = 0;
        const medSummary = log.medications.map(m => {
            const medInfo = BENZO_DATA.find(b => b.id === m.medicationId);
            if (medInfo) dailyDiazepamEq += m.amount * medInfo.diazepamEquivalence;
            return `${medInfo?.name || m.medicationId}: ${m.amount}mg`;
        }).join(', ');
        
        return `Date: ${log.date}, Alcohol: ${log.alcoholConsumed ? log.alcoholUnits + ' units' : 'None'}, Meds: [${medSummary}], Approx Diazepam Eq: ${dailyDiazepamEq}mg`;
    }).join('\n');

    const prompt = `
      You are a compassionate, non-judgmental recovery assistant for 'SoberStats', an app for people recovering from alcohol addiction who may be using benzodiazepines (possibly for withdrawal or maintenance).
      
      Analyze the following 7 days of logs:
      ${summary}
      
      Your goal is to support their sobriety from alcohol while monitoring their medication usage.
      
      Guidelines:
      1. Celebrate days without alcohol.
      2. If medication usage (Diazepam Equivalent) is trending down, encourage their tapering progress.
      3. If medication usage is spiking, gently remind them of the goal of stability.
      4. Be vigilant for "symptom substitution" (e.g., stopping alcohol but heavily increasing benzos).
      5. Brief (max 3 sentences). Casual tone. Address the user as "you". 
      6. DO NOT give medical advice or tell them to see a doctor in every message.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Unable to generate insights at this moment. Stay strong and keep tracking.";
  }
};