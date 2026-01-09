import Resume, { IResume } from "../../../models/Resume";
import { uploadToS3, deleteFromS3 } from "../../../services/s3Service";
import path from "path";
import logger from "../../../helpers/logger";

export const findResumeById = async (id: string) => {
  return Resume.findById(id).populate("posterId", "-password");
};

export const findLatestResumeByUser = async (userId: string) => {
  return Resume.findOne({ posterId: userId }).populate("posterId", "-password");
};

export const findResumesByUser = async (userId: string) => {
  return Resume.find({ posterId: userId }).populate("posterId", "-password");
};

export const findResumesWithFilters = async (filters: any, page: number, limit: number) => {
  return Resume.find(filters)
    .sort({ updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("posterId", "-password");
};

export const countResumesWithFilters = async (filters: any) => {
  return Resume.countDocuments(filters);
};

// Helper: deterministic key per user
const buildUserResumeKey = (userId: string, file: Express.Multer.File, format?: string) => {
  const extFromFile = path.extname(file.originalname || "").toLowerCase();
  const ext =
    extFromFile ||
    (file.mimetype === "application/pdf" || format === "pdf" ? ".pdf"
      : file.mimetype === "image/png" || format === "png" ? ".png"
      : ".jpg");

  return `resumes/${userId}/resume${ext}`;
};

export const upsertUserResume = async (
  userId: string,
  format?: string,
  description?: string,
  file?: Express.Multer.File
) => {
  try {
    if (!file) {
      throw new Error("File is required to upload a resume");
    }

    const s3Key = buildUserResumeKey(userId, file, format);
    const uploadResult = await uploadToS3(file, s3Key); 

    const resume = await Resume.findOneAndUpdate(
      { posterId: userId },
      {
        posterId: userId,
        format,
        description,
        url: uploadResult.url,
        s3Key: uploadResult.key,
        currentVersionId: uploadResult.versionId ?? null,
        aiFeedback: "", // reset; worker regenerates
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return resume;
  } catch (error) {
    logger.error("Error upserting resume: ", error);
    throw error;
  }
};

export const updateResumeData = async (
  id: string,
  format?: string,
  description?: string,
  file?: Express.Multer.File
) => {
  try {
    const resume = await Resume.findById(id);
    if (!resume) return null;

    if (file) {
      const key = resume.s3Key || buildUserResumeKey(String(resume.posterId), file, format);
      const uploadResult = await uploadToS3(file, key);

      resume.url = uploadResult.url;
      resume.s3Key = uploadResult.key;
      resume.currentVersionId = uploadResult.versionId ?? null;

      // Whenever a new file is uploaded, feedback should be regenerated
      resume.aiFeedback = "";
    }

    if (format) resume.format = format;
    if (typeof description === "string") resume.description = description;

    return resume.save();
  } catch (error) {
    logger.error("Error updating resume data: ", error);
    throw error;
  }
};

export const deleteResumeData = async (id: string) => {
  const resume = await Resume.findById(id);
  if (!resume) return null;

  if (resume.url) {
    await deleteFromS3(resume.url.split("?")[0]);
  }

  return Resume.findByIdAndDelete(id);
};
