import express, { Request, Response, NextFunction } from 'express';
import { register, login } from '../controllers/authController';

const router = express.Router();

router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  register(req, res).catch(next);
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  login(req, res).catch(next);
});

export default router;
