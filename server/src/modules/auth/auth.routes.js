import { Router } from 'express';
import { AuthController } from '../auth/auth.controller.js';
import { AuthService } from '../auth/auth.service.js';
import { UserRepository } from '../auth/user.repository.js';
import { authenticate } from './middleware/auth.middleware.js';

const router = Router();

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.post('/refresh', (req, res) => authController.refreshToken(req, res));
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.get('/profile', authenticate, (req, res) => authController.getProfile(req, res));
router.put('/profile', authenticate, (req, res) => authController.updateProfile(req, res));
router.post('/password/change', authenticate, (req, res) =>
  authController.changePassword(req, res)
);

export const authRoutes = router;