import jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();
export const authMiddleware = (req, res, next) => {
    var _a;
    const token = (_a = req.header('Authorization')) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
    const jwtSecret = process.env.FEEDBACK_JWT_PRIVATE_KEY;
    if (!token) {
        res.status(401).json({ message: 'No token, authorization denied' });
        return;
    }
    if (!jwtSecret) {
        throw new Error("FEEDBACK_JWT_PRIVATE_KEY is not defined");
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = { userId: decoded.userId, isAdmin: decoded.isAdmin };
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
        next(error);
    }
};
