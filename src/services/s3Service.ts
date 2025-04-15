import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import s3 from '../helpers/awsConfig';
import multer from 'multer';
import path from 'path';
import logger from '../helpers/logger';

// S3 Bucket Configuration
const BUCKET_NAME = "feedback-fs";
const CLOUDFRONT_URL = "https://d1ldjxzzmwekb0.cloudfront.net";

// Multer Configuration
const storage = multer.memoryStorage(); // Store files in memory to be uploaded to S3.
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB.
});


/**
 * Formats a Date object into a string in 'YYYY-MM-DD' format.
 * @param date The Date object to format.
 * @returns The formatted date string.
*/
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
  const day = date.getDate().toString().padStart(2, '0'); 
  return `${year}-${month}-${day}`;
};


/**
 * Uploads a file to S3.
 * @param file The file to upload (Express.Multer.File).
 * @param fileName Optional filename to use in S3. If not provided, a unique filename is generated.
 * @returns The URL of the uploaded file on CloudFront, or throws an error if upload fails.
*/
const uploadToS3 = async (file: Express.Multer.File, fileName?: string) => {
  const ext = path.extname(file.originalname); // Get the file extension
  const formattedDate = formatDate(new Date()); // Format the current date
  const uniqueId = uuidv4(); // Generate a unique ID for the file name

  // Determine the folder in S3 based on the file type
  const folderName = ['.pdf', '.docx'].includes(ext) ? 'pdf' : 'image';
  const key = fileName || `${folderName}/resume_${formattedDate}_${uniqueId}${ext}`; 
  
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const retryLimit = 3; // Number of retry attempts.

  // Retry logic for uploading to S3
  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      const upload = new Upload({
        client: s3, // S3 client from awsConfig.ts.
        params: uploadParams, // Parameters for the upload.
      });

      const result = await upload.done(); // Wait for the upload to complete.
      logger.info(`File uploaded successfully to S3: ${result.Key}`);

      return `${CLOUDFRONT_URL}/${result.Key}`; // Return the CloudFront URL of the uploaded file.

    } catch (error) {
      logger.error(`Error uploading file to S3, attempt ${attempt}:`, error);
      if (attempt === retryLimit) {
        throw new Error('Upload to S3 failed after multiple attempts');
      }
    }
  }
};

/**
 * Deletes a file from S3.
 * @param url The CloudFront URL of the file to delete.
 * @returns A promise that resolves when the file is deleted, or throws an error if deletion fails.
*/
const deleteFromS3 = async (url: string): Promise<void> => {
  const key = url.replace(`${CLOUDFRONT_URL}/`, ''); // Extract the S3 key from the CloudFront URL.

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key })); // Send the delete command to S3.
    logger.info(`File deleted successfully from S3: ${key}`);
  } catch (error) {
    logger.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};

export { upload, uploadToS3, deleteFromS3 };