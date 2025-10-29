import express from 'express';
import { registerUser, loginUser, forcePasswordChange } from '../controllers/authController.js'; // <-- NEW IMPORT
import { authMiddleware } from '../middleware/authMiddleware.js'; // <-- NEW IMPORT
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Secure endpoint for compulsory password change
// Requires authentication (token) and is used when mustChangePassword is true.
router.post('/change-password', authMiddleware(['student', 'faculty', 'admin']), forcePasswordChange); 

export default router;