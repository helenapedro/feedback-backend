import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IResume extends Document {
  posterId: IUser['_id'];
  format?: string;
  url?: string;
  s3Key: string; 
  currentVersionId?: string | null; 
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
      unique: true,
      index: true,
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

    s3Key: {
      type: String,
      required: true,
    },

    currentVersionId: {
      type: String,
      required: false,
      default: null,
    },

    description: { 
      type: String, 
      required: false, 
      maxlength: 500,
    },

    aiFeedback: {
      type: String,
      default: "" 
    },

  },

  { timestamps: true }

);

ResumeSchema.index({ posterId: 1 });
ResumeSchema.index({ createdAt: -1 }); 
ResumeSchema.index({ updatedAt: -1 });

export default mongoose.model<IResume>('Resume', ResumeSchema);
