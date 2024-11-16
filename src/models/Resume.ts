import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  posterId: mongoose.Types.ObjectId;
  format: string;
  url: string;
  description?: string;
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
      maxlength: 500,
    },
  },
  { timestamps: true }
);

ResumeSchema.index({ posterId: 1 });
ResumeSchema.index({ createdAt: -1 }); 

export default mongoose.model<IResume>('Resume', ResumeSchema);
