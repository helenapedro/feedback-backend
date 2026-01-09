import { Upload } from "@aws-sdk/lib-storage";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import s3 from "../config/awsConfig";
import multer from "multer";
import path from "path";
import logger from "../helpers/logger";

const BUCKET_NAME = "feedback-fs";
const CLOUDFRONT_URL = "https://d1ldjxzzmwekb0.cloudfront.net";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export type UploadToS3Result = {
  url: string;
  key: string;
  versionId?: string;
};

const uploadToS3 = async (file: Express.Multer.File, fileName?: string): Promise<UploadToS3Result> => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const formattedDate = formatDate(new Date());
  const uniqueId = uuidv4();

  const folderName = [".pdf", ".docx"].includes(ext) ? "pdf" : "image";
  const key = fileName || `${folderName}/resume_${formattedDate}_${uniqueId}${ext}`;

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const retryLimit = 3;

  for (let attempt = 1; attempt <= retryLimit; attempt++) {
    try {
      const uploader = new Upload({
        client: s3,
        params: uploadParams,
      });

      const result: any = await uploader.done();

      const uploadedKey = result?.Key || key;
      const versionId = result?.VersionId;

      logger.info(
        `File uploaded successfully to S3: ${uploadedKey}${versionId ? ` (VersionId: ${versionId})` : ""}`
      );

      return {
        url: `${CLOUDFRONT_URL}/${uploadedKey}`,
        key: uploadedKey,
        versionId,
      };
    } catch (error) {
      logger.error(`Error uploading file to S3, attempt ${attempt}:`, error);
      if (attempt === retryLimit) {
        throw new Error("Upload to S3 failed after multiple attempts");
      }
    }
  }

  // Just to satisfy TS control-flow (should never hit due to throw above)
  throw new Error("Upload to S3 failed");
};

const deleteFromS3 = async (url: string): Promise<void> => {
  const key = url.replace(`${CLOUDFRONT_URL}/`, "");

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    logger.info(`File deleted successfully from S3: ${key}`);
  } catch (error) {
    logger.error("Error deleting file from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
};

export { upload, uploadToS3, deleteFromS3 };
