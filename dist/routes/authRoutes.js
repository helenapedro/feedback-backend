import express from 'express';
import { register, login, getUser, updateUser, deleteUser, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middlewares/auth';
const router = express.Router();
router.post('/register', (req, res, next) => {
    register(req, res).catch(next);
});
router.post('/login', (req, res, next) => {
    login(req, res).catch(next);
});
router.get('/user/:userId', authMiddleware, (req, res, next) => {
    getUser(req, res).catch(next);
});
router.put('/user/update', authMiddleware, (req, res, next) => {
    updateUser(req, res).catch(next);
});
router.delete('/user/delete', authMiddleware, (req, res, next) => {
    deleteUser(req, res).catch(next);
});
router.post('/user/change-password', authMiddleware, (req, res, next) => {
    changePassword(req, res).catch(next);
});
export default router;
