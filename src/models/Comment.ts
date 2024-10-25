import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  resumeId: mongoose.Types.ObjectId;
  commenterId: mongoose.Types.ObjectId;
  content: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    resumeId: { 
      type: mongoose.Types.ObjectId, 
      ref: 'Resume', 
      required: true 
    },
    commenterId: { 
      type: mongoose.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    isDeleted: { 
      type: Boolean, 
      default: false 
    }, 
  },
  { timestamps: true }
);

CommentSchema.index({ resumeId: 1 });

export default mongoose.model<IComment>('Comment', CommentSchema);
 