// sqsWorker.ts
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import Resume from './models/Resume';
import { generateAIFeedback } from './services/AIFeedbackGenerator';
import logger from './helpers/logger';
import * as dotenv from 'dotenv';
import s3 from './helpers/awsConfig'; 

dotenv.config();

async function initializeSqsClient() {
  const region = await s3.config.region();
  return new SQSClient({ region });
}

async function processMessages() {
  const sqsClient = await initializeSqsClient();
  const queueUrl = process.env.AWS_SQS_QUEUE_URL;

  if (!queueUrl) {
    logger.error('AWS_SQS_QUEUE_URL is not defined');
    return;
  }

  try {
    const receiveParams = {
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 10, // Receive up to 10 messages at a time.
      WaitTimeSeconds: 20, // Long polling: wait up to 20 seconds for messages.
    };

    const receiveResult = await sqsClient.send(new ReceiveMessageCommand(receiveParams));
    const messages = receiveResult.Messages;

    if (messages && messages.length > 0) {
      for (const message of messages) {
        try {
          const messageBody = JSON.parse(message.Body || '{}');
          const { resumeId, extractedText } = messageBody;

          if (!resumeId) {
            logger.error('Resume ID is missing in the message');
            continue;
          }

          const feedback = await generateAIFeedback(resumeId, extractedText);

          // Update resume document with AI feedback
          await Resume.findByIdAndUpdate(resumeId, { aiFeedback: feedback });

          // Delete message from queue
          const deleteParams = {
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle,
          };
          await sqsClient.send(new DeleteMessageCommand(deleteParams));

          logger.info(`Processed message for resumeId: ${resumeId}`);
        } catch (error) {
          logger.error('Error processing message:', error);
        }
      }
    } else {
      logger.info('No messages in the queue');
    }
  } catch (error) {
    logger.error('Error receiving messages:', error);
  }

  // Process messages again after a short delay
  setTimeout(processMessages, 5000); // Poll every 5 seconds.
}

// Start processing messages
processMessages();