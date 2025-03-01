import AIFeedback from "../models/AIFeedback";
import { generateAIFeedback } from "./AIFeedbackGenerator";

export const requestAIFeedback = async (resumeId: string) => {
  try {
    const feedback = await generateAIFeedback(resumeId);

    const newFeedback = new AIFeedback({
      resumeId,
      content: feedback,
    });

    await newFeedback.save();
    return newFeedback;
  } catch (error) {
    console.error("Error saving AI feedback:", error);
    return null;
  }
};
