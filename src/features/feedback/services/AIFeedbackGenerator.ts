import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import dotenv from "dotenv";

dotenv.config();

const bedrockRegion = process.env.AWS_REGION || process.env.BEDROCK_REGION;
const bedrockModelId = process.env.BEDROCK_MODEL_ID;

const bedrockClient = bedrockRegion
  ? new BedrockRuntimeClient({ region: bedrockRegion })
  : null;

const decodeResponse = (body: InvokeModelCommandOutput["body"]) => {
  if (!body) return "";
  if (typeof body === "string") return body;
  if (body instanceof Uint8Array || Buffer.isBuffer(body)) {
    return new TextDecoder().decode(body);
  }
  return "";
};

export const generateAIFeedback = async (resumeId: string, extractedText: string): Promise<string> => {
  if (!extractedText?.trim()) {
    throw new Error("No resume text provided for AI feedback.");
  }

  if (!bedrockRegion || !bedrockClient) {
    throw new Error("Missing Bedrock region configuration.");
  }

  if (!bedrockModelId) {
    throw new Error("Missing Bedrock model identifier.");
  }

  try {
    const payload = JSON.stringify({
      inputText: `Analyze the following resume and provide constructive feedback:\n\n${extractedText}`,
      parameters: {
        max_tokens: 500,
        temperature: 0.6,
      },
    });

    const command = new InvokeModelCommand({
      modelId: bedrockModelId,
      contentType: "application/json",
      accept: "application/json",
      body: payload,
    });

    const response = await bedrockClient.send(command);
    const decoded = decodeResponse(response.body);

    const parsed = decoded ? JSON.parse(decoded) : {};
    const outputText = parsed.outputText || parsed.result;

    if (!outputText?.trim()) {
      throw new Error("No feedback generated from Bedrock.");
    }

    return outputText.trim();
  } catch (error) {
    console.error(`Error generating AI feedback for resume ${resumeId}:`, error);
    throw error instanceof Error ? error : new Error("Failed to generate AI feedback.");
  }
};
