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
export const analyzeProductionData = async (entries: any[]) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بصفتك خبير إنتاج، قم بتحليل البيانات التالية وقدم تقريراً مختصراً باللغة العربية حول المشاكل الرئيسية وكيفية تحسين المردودية: ${JSON.stringify(entries)}`,
    });
    // Use the .text property on GenerateContentResponse directly as recommended.
    return response.text;
  } catch (error) {
    console.error("Error analyzing production:", error);
    return "تعذر تحليل البيانات حالياً.";
  }
};
