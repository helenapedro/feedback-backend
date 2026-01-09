import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand
} from "@aws-sdk/client-sqs";
import Resume from "../../../models/Resume";
import { generateAIFeedback } from "../services/AIFeedbackGenerator";
import * as dotenv from "dotenv";
import s3 from "../../../config/awsConfig";
import logger from "../../../helpers/logger";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import pdfParse from "pdf-parse";

dotenv.config();

const BUCKET_NAME = "feedback-fs";

// Small helper to convert S3 stream to Buffer
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

async function initializeSqsClient() {
  const region = await s3.config.region();
  return new SQSClient({ region });
}

// Fetch latest (or a specific version) resume file from S3
async function fetchResumeBufferFromS3(s3Key: string, versionId?: string | null): Promise<Buffer> {
  const cmd = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ...(versionId ? { VersionId: versionId } : {}),
  });

  const result: any = await s3.send(cmd);
  if (!result?.Body) throw new Error("S3 GetObject returned empty body");

  return streamToBuffer(result.Body);
}

// Extract text (PDF supported now; extend later for docx)
async function extractTextFromResume(buffer: Buffer, s3Key: string): Promise<string> {
  const ext = (s3Key.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") {
    const parsed = await pdfParse(buffer);
    return (parsed.text || "").trim();
  }

  // TODO: implement docx extraction if needed
  return "";
}

async function processMessages() {
  const sqsClient = await initializeSqsClient();
  const queueUrl = process.env.AWS_SQS_QUEUE_URL;

  if (!queueUrl) {
    logger.error("AWS_SQS_QUEUE_URL is not defined");
    return;
  }

  try {
    const receiveParams = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    };

    const receiveResult = await sqsClient.send(new ReceiveMessageCommand(receiveParams));
    const messages = receiveResult.Messages;

    if (messages && messages.length > 0) {
      for (const message of messages) {
        try {
          const messageBody = JSON.parse(message.Body || "{}");
          const { resumeId, extractedText, versionId } = messageBody;

          if (!resumeId) {
            logger.error("Resume ID is missing in the message");
            continue;
          }

          // 1) Get resume (need s3Key if extractedText missing)
          const resume = await Resume.findById(resumeId).select("s3Key currentVersionId");
          if (!resume) {
            logger.error(`Resume not found for resumeId: ${resumeId}`);
            continue;
          }

          let finalText = (typeof extractedText === "string" ? extractedText : "").trim();

          // 2) If not provided, fetch file from S3 and extract
          if (!finalText) {
            const effectiveVersionId =
              (typeof versionId === "string" && versionId) ? versionId : (resume.currentVersionId || null);

            const buffer = await fetchResumeBufferFromS3(resume.s3Key, effectiveVersionId);
            finalText = await extractTextFromResume(buffer, resume.s3Key);

            logger.info(
              `Extracted text from S3 for resumeId=${resumeId} key=${resume.s3Key} versionId=${effectiveVersionId || "LATEST"}`
            );
          }

          // 3) Generate feedback
          const feedback = await generateAIFeedback(resumeId, finalText);

          // 4) Save feedback
          await Resume.findByIdAndUpdate(resumeId, { aiFeedback: feedback });

          // 5) Delete SQS message
          const deleteParams = {
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          };
          await sqsClient.send(new DeleteMessageCommand(deleteParams));

          logger.info(`Processed message for resumeId: ${resumeId}`);
        } catch (error) {
          logger.error("Error processing message:", error);
        }
      }
    } else {
      logger.info("No messages in the queue");
    }
  } catch (error) {
    logger.error("Error receiving messages:", error);
  }

  setTimeout(processMessages, 5000);
}

processMessages();
