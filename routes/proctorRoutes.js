import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { logViolation } from '../controllers/proctorController.js';

const router = express.Router();

// All proctor routes require a student to be logged in
router.use(authMiddleware(['student'])); 

// Log a violation
router.post('/:instanceId/log', logViolation);

export default router;