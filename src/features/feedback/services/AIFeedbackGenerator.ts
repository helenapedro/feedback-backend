import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const geminiApiKey = process.env.GEMINI_API_KEY;
const geminiModelId = process.env.GEMINI_MODEL_ID || "gemini-1.5-flash";

if (!geminiApiKey) {
  throw new Error(
    "GEMINI_API_KEY is not defined. Please set it in your .env file."
  );
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: geminiModelId });

const buildPrompt = (extractedText?: string): string => {
  const hasText = typeof extractedText === "string" && extractedText.trim().length > 0;

  return `
You are an experienced recruiter and ATS (Applicant Tracking System) specialist.

Your task is to analyze a resume and provide clear, structured, and actionable feedback.

${hasText
  ? `Resume content:
${extractedText}`
  : `
IMPORTANT:
The resume text could not be extracted or is empty.
This may happen if the resume is scanned, image-based, or poorly formatted.
In this case:
- Do NOT assume missing information
- Provide general resume best practices
- Explain why text extraction may have failed
- Suggest concrete steps to fix this (e.g., export as searchable PDF, avoid images, etc.)
`}

Please include:
1. Strengths (bullet points)
2. Weaknesses or gaps
3. Suggestions to rewrite bullet points (with examples)
4. ATS optimization tips (keywords, formatting, structure)
5. A short "Next Steps" checklist (max 5 items)

Be professional, concise, and practical.
`.trim();
};

export const generateAIFeedback = async (
  resumeId: string,
  extractedText?: string
): Promise<string> => {
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
