import mongoose, { Schema } from 'mongoose';
const CommentSchema = new Schema({
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
}, { timestamps: true });
CommentSchema.index({ resumeId: 1 });
export default mongoose.model('Comment', CommentSchema);
