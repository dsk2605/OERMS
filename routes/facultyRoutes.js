import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
// --- CORRECTED Imports ---
import {
    // Exam Management
    createExam,
    updateExam,
    deleteExam,
    getMyCreatedExams,

    // Exam-Specific Question Management
    createQuestion,         // Keep (logic changed in controller)
    getExamQuestions,       // New
    updateExamQuestion,     // New (replaces old skeleton)
    deleteExamQuestion,     // New (replaces old skeleton)

    // Hierarchy & Student Management
    getAllHODs,
    requestHOD,
    getStudentRequests,
    manageStudentRequest,
    getMyStudents,
    bulkProvisionStudents,
    provisionStudent,

    // Results Viewing
    getExamSubmissions
    // REMOVED getQuestions, getQuestionCount
} from '../controllers/facultyController.js';

const router = express.Router();

// Middleware applies to all routes below
router.use(authMiddleware(['faculty', 'admin']));

// --- Exam Routes ---
router.post('/exams', createExam);
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);
router.get('/my-exams', getMyCreatedExams); // Route to view faculty's own exams

// --- NEW Exam-Specific Question Routes ---
router.post('/exams/:examId/questions', createQuestion); // Add question TO an exam
router.get('/exams/:examId/questions', getExamQuestions); // Get questions FOR an exam
router.put('/exams/:examId/questions/:questionId', updateExamQuestion); // Update question IN an exam
router.delete('/exams/:examId/questions/:questionId', deleteExamQuestion); // Delete question FROM an exam

// --- REMOVED Old Question Bank Routes ---
// router.get('/questions', getQuestions); // Removed
// router.get('/questions/count', getQuestionCount); // Removed

// --- Hierarchy Routes ---
router.get('/hod-list', getAllHODs);
router.post('/request-hod/:hodId', requestHOD);

// --- Student Management Routes ---
router.post('/students/provision', provisionStudent); // Single student add
router.post('/students/bulk-provision', bulkProvisionStudents); // Bulk add
router.get('/student-requests', getStudentRequests); // View pending requests
router.put('/manage-request/:affiliationId', manageStudentRequest); // Approve/reject students
router.get('/my-students', getMyStudents); // View approved students

// --- Results Viewing Route ---
router.get('/submissions', getExamSubmissions);

export default router;