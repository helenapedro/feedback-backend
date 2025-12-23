import mongoose from "mongoose";
import AIFeedback from "../../../models/AIFeedback";
import { generateAIFeedback } from "./AIFeedbackGenerator";

const toObjectId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid resumeId provided: ${id}`);
  }

  return new mongoose.Types.ObjectId(id);
};

export const requestAIFeedback = async (resumeId: string, extractedText: string) => {
  const resumeObjectId = toObjectId(resumeId);

  try {
    const feedback = await generateAIFeedback(resumeId, extractedText);

    const newFeedback = new AIFeedback({
      resumeId: resumeObjectId,
      content: feedback,
    });

    await newFeedback.save();
    return newFeedback;
  } catch (error) {
    console.error("Error saving AI feedback:", error);
    throw error;
  }
};
