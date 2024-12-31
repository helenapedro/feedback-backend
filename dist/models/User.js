import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (email) => /\S+@\S+\.\S+/.test(email),
            message: 'Email is not valid.',
        },
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });
UserSchema.index({ email: 1 });
export default mongoose.model('User', UserSchema);
