import mongoose, { Schema } from 'mongoose';
const ResumeSchema = new Schema({
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
}, { timestamps: true });
ResumeSchema.index({ posterId: 1 });
ResumeSchema.index({ createdAt: -1 });
export default mongoose.model('Resume', ResumeSchema);
