import express, { Request, Response, NextFunction } from 'express';
import { getAllUsers } from '../controllers/adminController';
import { authMiddleware } from '../../../middlewares/auth';

const router = express.Router();

router.get('/users', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  getAllUsers(req, res).catch(next);
});

export default router;
