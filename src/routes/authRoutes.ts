import express, { Request, Response, NextFunction } from 'express';
import { 
  register, 
  login, 
  getUser,
  updateUser,
  deleteUser,
  changePassword 
} from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();

router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  register(req, res).catch(next);
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  login(req, res).catch(next);
});

router.get('/user/:userId', authMiddleware,  (req: Request, res: Response, next: NextFunction) => {
  getUser(req, res).catch(next);
}); 

router.put('/user/update', authMiddleware,  (req: Request, res: Response, next: NextFunction) => {
  updateUser(req, res).catch(next);
}); 

router.delete('/user/delete', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  deleteUser(req, res).catch(next);
});

router.post('/user/change-password', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  changePassword(req, res).catch(next);
});
export default router;
