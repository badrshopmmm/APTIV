import { GoogleGenAI } from "@google/genai";

// Re-creating the instance right before the call to ensure the latest API key is utilized.
export const editLeaderImage = async (base64Image: string, prompt: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `Edit this profile photo based on: ${prompt}. Return only the modified image.`,
          },
        ],
      },
    });

    // Iterate through candidates to find the image part as per current GenAI SDK standards
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    return null;
  }
};

// Re-creating the instance right before the call to ensure the latest API key is utilized.
export const analyzeProductionData = async (entries: any[], historicalData: any[] = []) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Extract downtime reasons from historical data
    const historicalStoppages = historicalData
      .filter(entry => entry.downtimeReason && entry.downtimeReason !== 'None')
      .map(entry => entry.downtimeReason);
    
    // Extract notes from current entries that might indicate stoppages
    const currentNotes = entries
      .filter(h => h.note && h.note.trim() !== '')
      .map(h => h.note);

    const prompt = `
      بصفتك خبير إنتاج في شركة APTIV، قم بتحليل بيانات الإنتاج الحالية وسجل التوقفات التاريخي.
      
      البيانات الحالية:
      ${JSON.stringify(entries)}
      
      ملاحظات التوقف الحالية:
      ${JSON.stringify(currentNotes)}
      
      سجل التوقفات التاريخي (Production Stoppage Log):
      ${JSON.stringify(historicalStoppages)}
      
      المطلوب:
      1. تحليل أداء الخط الحالي (الكفاءة، المرفوضات).
      2. تحديد أسباب التوقف المتكررة بناءً على السجل التاريخي والملاحظات الحالية.
      3. اقتراح تدابير وقائية (Preventative Measures) محددة وعملية لتجنب هذه التوقفات مستقبلاً وتحسين المردودية.
      
      قدم التقرير باللغة العربية بشكل مهني ومختصر.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error analyzing production:", error);
    return "تعذر تحليل البيانات حالياً.";
  }
};
