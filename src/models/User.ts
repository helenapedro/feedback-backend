import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
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
        validator: (email: string) => /\S+@\S+\.\S+/.test(email),
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
  },
  { timestamps: true } 
);

UserSchema.index({ email: 1 });

export default mongoose.model<IUser>('User', UserSchema);
