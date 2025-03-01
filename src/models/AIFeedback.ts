import mongoose, { Schema, Document } from "mongoose";

export interface IAIFeedback extends Document {
  resumeId: mongoose.Types.ObjectId;
  generatedBy: string; // "AI"
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIFeedbackSchema: Schema = new Schema(
  {
    resumeId: { 
      type: mongoose.Types.ObjectId, 
      ref: "Resume", 
      required: true 
    },
    generatedBy: { 
      type: String, 
      default: "AI" 
    },
    content: { 
      type: String, 
      required: true 
    },
  },
  { timestamps: true }
);

AIFeedbackSchema.index({ resumeId: 1 });

export default mongoose.model<IAIFeedback>("AIFeedback", AIFeedbackSchema);
