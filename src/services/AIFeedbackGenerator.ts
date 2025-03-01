import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const generateAIFeedback = async (resumeId: string, extractedText: string): Promise<string> => {
  if (!extractedText) {
    console.error("No resume text provided for AI feedback.");
    return "No resume text available for analysis.";
  }

  try {
    const response = await axios.post(
      "https://bedrock-runtime.us-east-2.amazonaws.com/model/deepseek-r1-distill-qwen-1.5b/invoke",
      {
        inputText: `Analyze the following resume and provide constructive feedback:\n\n${extractedText}`,
        parameters: {
          max_tokens: 500, 
          temperature: 0.6,   
        },
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.AWS_BEDROCK_API_KEY}`,
          "Content-Type": "application/json",
          "X-Amz-Target": "AmazonBedrock.InvokeModel",
        },
      }
    );

    return response.data.outputText?.trim() || "No feedback generated.";
  } catch (error) {
    console.error("Error generating AI feedback:", error);
    return "Failed to generate AI feedback.";
  }
};
