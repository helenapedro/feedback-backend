import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IResume extends Document {
  posterId: IUser['_id'];
  format?: string;
  url?: string;
  s3Key?: string | null; // S3 key for the file, if applicable
  description?: string;
  aiFeedback: string;
  createdAt: Date;
  updatedAt: Date;
} 

const ResumeSchema: Schema = new Schema(
  {
    posterId: { 
      type: mongoose.Types.ObjectId, 
      ref: 'User', 
      required: true,
    },
    format: { 
      type: String, 
      required: true,
      enum: ['pdf', 'docx', 'jpg', 'jpeg', 'png'], 
    },
    url: { 
      type: String, 
      required: true 
    }, 
    description: { 
      type: String, 
      required: false, 
      maxlength: 500, // Limit description to 500 characters for concise summaries.
    },
    aiFeedback: {
      type: String,
      default: "" // feedback is always stored, even if empty initially
    }
  },
  { timestamps: true }
);

ResumeSchema.index({ posterId: 1 });
ResumeSchema.index({ createdAt: -1 }); 

export default mongoose.model<IResume>('Resume', ResumeSchema);
