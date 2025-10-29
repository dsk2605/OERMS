import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { startExam, submitExam, getAllFaculty, requestFaculty, getExamQuestions, getMyExams, getMyApprovedFaculty, getExamsByFaculty  } from '../controllers/studentController.js'; // <-- NEW IMPORT

const router = express.Router();

// Apply RBAC: Only Student and Admin can use these routes 
router.use(authMiddleware(['student', 'admin'])); 

// Student Exam Access
router.get('/exams', (req, res) => res.status(501).json({ message: 'Not Implemented: Get scheduled exams' }));

// DFD Process 3: Start Exam (FR5 - Randomized Generation)
router.post('/exams/:id/start', startExam); // <-- NOW USING THE REAL CONTROLLER FUNCTION

router.post('/exams/:id/submit', submitExam); // Placeholder for submit
// NEW ROUTE: Get list of all faculty
router.get('/faculty-list', getAllFaculty);

// NEW ROUTE: Send enrollment request to a faculty
router.post('/request-faculty/:facultyId', requestFaculty);
router.get('/my-exams', getMyExams);
// NEW ROUTE: Get the list of faculty who approved this student
router.get('/my-faculty', getMyApprovedFaculty);

// NEW ROUTE: Get exams from a specific faculty (if approved)
router.get('/exams-by-faculty/:facultyId', getExamsByFaculty);
// NEW ROUTE: Get the questions for a specific, active exam instance
router.get('/exam-instance/:instanceId/questions', getExamQuestions);


export default router;