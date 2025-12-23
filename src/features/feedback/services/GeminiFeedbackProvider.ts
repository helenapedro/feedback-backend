import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;

const geminiModel = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash";

export async function generateWithGemini(prompt: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error(
      "GEMINI_API_KEY not configured."
    );
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: geminiModel });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  if (!text?.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  return text.trim();
}
