import mongoose from "mongoose";

export const validateUserId = (userId: string): boolean => {
  // Check if the userId is a valid ObjectId
  return mongoose.Types.ObjectId.isValid(userId);
};

export const checkAuthorization = (resourceOwnerId: string, userId: string, isAdmin: boolean): boolean => {
     return resourceOwnerId === userId || isAdmin;
};

export const validateDescriptionLength = (description: string): boolean => {  
  // Check if the description length is within the allowed range
  return description.length >= 10 && description.length <= 500;
}