import { AuthRequest } from "../middlewares/auth";
import { checkAuthorization } from "./../helpers/validation";
import { Response } from "express";
import Resume from "../models/Resume";
import { ListObjectVersionsCommand, CopyObjectCommand } from "@aws-sdk/client-s3";
import { format } from "date-fns";
import s3 from "../config/awsConfig";
import logger from "../helpers/logger";

const CLOUDFRONT_URL = "https://d1ldjxzzmwekb0.cloudfront.net";
const BUCKET_NAME = "feedback-fs";

async function resolveResume(req: AuthRequest) {
  const id = req.params.id;
  const userId = req.user?.userId;

  if (id) {
    return Resume.findById(id).select("posterId s3Key url currentVersionId aiFeedback");
  }

  // When no :id is provided, use the authenticated user's resume
  if (userId) {
    return Resume.findOne({ posterId: userId }).select("posterId s3Key url currentVersionId aiFeedback");
  }

  return null;
}

export const listResumeVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { userId, isAdmin } = req.user;

  try {
    const resume = await resolveResume(req);

    if (!resume) {
      res.status(404).json({ message: "Resume not found" });
      return;
    }

    if (!checkAuthorization(resume.posterId.toString(), userId, isAdmin)) {
      logger.info("Not authorized to view this resume");
      res.status(403).json({ message: "Not authorized to view this resume" });
      return;
    }

    if (!resume.s3Key) {
      res.status(400).json({ message: "Resume has no s3Key configured" });
      return;
    }

    const command = new ListObjectVersionsCommand({
      Bucket: BUCKET_NAME,
      Prefix: resume.s3Key,
    });

    const data = await s3.send(command);

    // Filter only versions for the exact key (avoid prefix collisions)
    const versionsRaw = (data.Versions || []).filter((v) => v.Key === resume.s3Key);

    const versions = versionsRaw.map((version) => {
      const lastModified = version.LastModified ? new Date(version.LastModified) : new Date();
      return {
        key: version.Key,
        versionId: version.VersionId,
        lastModified: version.LastModified,
        size: version.Size,
        isLatest: version.IsLatest,
        name: `Resume version from ${format(lastModified, "yyyy-MM-dd HH:mm")}`,
      };
    });

    res.status(200).json({ s3Key: resume.s3Key, versions });
  } catch (error) {
    logger.error("Error listing resume versions:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const restoreResumeVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  const { versionId } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { userId, isAdmin } = req.user;

  try {
    const resume = await resolveResume(req);

    if (!resume) {
      res.status(404).json({ message: "Resume not found" });
      return;
    }

    if (!checkAuthorization(resume.posterId.toString(), userId, isAdmin)) {
      res.status(403).json({ message: "Not authorized to restore this resume" });
      return;
    }

    if (!resume.s3Key) {
      res.status(400).json({ message: "Resume has no s3Key configured" });
      return;
    }

    if (!versionId) {
      res.status(400).json({ message: "versionId is required" });
      return;
    }

    // Copy the chosen version onto the same key => creates a NEW latest version
    const copyCommand = new CopyObjectCommand({
      Bucket: BUCKET_NAME,
      CopySource: `${BUCKET_NAME}/${resume.s3Key}?versionId=${encodeURIComponent(versionId)}`,
      Key: resume.s3Key,
      ContentType: undefined, // keep original metadata
      MetadataDirective: "COPY",
    });

    const copyResult: any = await s3.send(copyCommand);

    const newVersionId = copyResult?.VersionId || null;

    const newUrl = `${CLOUDFRONT_URL}/${resume.s3Key}?t=${Date.now()}`;

    const updatedResume = await Resume.findByIdAndUpdate(
      resume._id,
      {
        url: newUrl,
        currentVersionId: newVersionId,
        aiFeedback: "", // reset feedback since content changed
      },
      { new: true }
    );

    res.status(200).json({ message: "Resume restored successfully", resume: updatedResume });
  } catch (error) {
    logger.error("Error restoring resume version:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
