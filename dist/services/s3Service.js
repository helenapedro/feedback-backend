var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import s3 from '../helpers/awsConfig';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../helpers/logger';
const BUCKET_NAME = "feedback-fs";
const CLOUDFRONT_URL = "https://d1ldjxzzmwekb0.cloudfront.net";
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const uploadToS3 = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const ext = path.extname(file.originalname);
    const formattedDate = formatDate(new Date());
    const uniqueId = uuidv4();
    const folderName = ['.pdf', '.docx'].includes(ext) ? 'pdf' : 'image';
    const fileName = `${folderName}/resume_${formattedDate}_${uniqueId}${ext}`;
    const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    const retryLimit = 3;
    for (let attempt = 1; attempt <= retryLimit; attempt++) {
        try {
            const upload = new Upload({
                client: s3,
                params: uploadParams,
            });
            const result = yield upload.done();
            return `${CLOUDFRONT_URL}/${result.Key}`;
        }
        catch (error) {
            logger.error(`Error uploading file to S3, attempt ${attempt}:`, error);
            if (attempt === retryLimit) {
                throw new Error('Upload to S3 failed after multiple attempts');
            }
        }
    }
});
const deleteFromS3 = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const key = url.replace(`${CLOUDFRONT_URL}/`, '');
    try {
        yield s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
        logger.info(`File deleted successfully from S3: ${key}`);
    }
    catch (error) {
        logger.error('Error deleting file from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
});
export { upload, uploadToS3, deleteFromS3 };
