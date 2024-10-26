"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToS3 = exports.upload = void 0;
const awsConfig_1 = __importDefault(require("../helpers/awsConfig"));
const lib_storage_1 = require("@aws-sdk/lib-storage");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../helpers/logger"));
const BUCKET_NAME = "feedback-fs";
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
exports.upload = upload;
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
const uploadToS3 = (file) => __awaiter(void 0, void 0, void 0, function* () {
    const ext = path_1.default.extname(file.originalname);
    const formattedDate = formatDate(new Date());
    const uniqueId = (0, uuid_1.v4)();
    const folderName = ['.pdf', '.docx'].includes(ext) ? 'pdf' : 'image';
    const fileName = `${folderName}/resume_${formattedDate}_${uniqueId}${ext}`;
    const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
    };
    try {
        const upload = new lib_storage_1.Upload({
            client: awsConfig_1.default,
            params: uploadParams,
        });
        const result = yield upload.done();
        return `https://${BUCKET_NAME}.s3.amazonaws.com/${result.Key}`;
    }
    catch (error) {
        logger_1.default.error("Error uploading file to S3:", error);
        throw new Error('Upload to S3 failed');
    }
});
exports.uploadToS3 = uploadToS3;
