import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModelId = process.env.GEMINI_MODEL_ID || "gemini-2.5-flash";

if (!geminiApiKey) {
  throw new Error(
    "GEMINI_API_KEY is not defined. Please set it in your .env file."
  );
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: geminiModelId });

const buildPrompt = (extractedText: string): string => {
  return `
You are an experienced recruiter and ATS (Applicant Tracking System) specialist.

Analyze the resume below and provide clear, structured, and actionable feedback.

Please include:
1. Strengths (bullet points)
2. Weaknesses or gaps
3. Suggestions to rewrite bullet points (with examples)
4. ATS optimization tips (keywords, formatting, structure)
5. A short "Next Steps" checklist (max 5 items)

Resume content:
${extractedText}
`.trim();
};

export const generateAIFeedback = async (
  resumeId: string,
  extractedText: string
): Promise<string> => {
  if (!extractedText || !extractedText.trim()) {
    throw new Error("No resume text provided for AI feedback.");
  }

  try {
    const prompt = buildPrompt(extractedText);

    const result = await model.generateContent(prompt);
    const feedback = result.response.text();

    if (!feedback || !feedback.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return feedback.trim();
  } catch (error) {
    console.error(
      `Error generating AI feedback with Gemini for resume ${resumeId}:`,
      error
    );
    throw error instanceof Error
      ? error
      : new Error("Failed to generate AI feedback using Gemini.");
  }
};
