import express from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Creating the endpoint: POST /api/auth/register
router.post('/register', registerUser);
// Creating the endpoint: POST /api/auth/login
router.post('/login', loginUser);

// the new protected route
// When this route is hit, it will run 'protect' FIRST.
// If 'protect' passes, it will then run 'getUserProfile'.
router.get('/me', protect, getUserProfile);

export default router;