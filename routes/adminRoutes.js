import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { 
    setFacultyCode, 
    getFacultyCode, 
    provisionStaff,
    getAllUsersByRole,
    getFacultyRequests,      // <-- IMPORT NEW
    manageFacultyRequest,    // <-- IMPORT NEW
    getMyFaculty,            // <-- IMPORT NEW
    getMyStudents_Inherited  // <-- IMPORT NEW
} from '../controllers/adminController.js'; 

const router = express.Router();
router.use(authMiddleware(['admin'])); 

// --- Existing Routes ---
router.post('/code/faculty', setFacultyCode);
router.get('/code/faculty', getFacultyCode);
router.post('/user/register', provisionStaff);
router.get('/users', getAllUsersByRole); // We'll replace this in the frontend soon

// --- NEW Hierarchy Routes ---

// Get pending faculty requests
router.get('/faculty-requests', getFacultyRequests);

// Approve/reject a faculty request
router.put('/manage-request/:affiliationId', manageFacultyRequest);

// Get all *approved* faculty for this HOD
router.get('/my-faculty', getMyFaculty);

// Get all students under this HOD's approved faculty
router.get('/my-students', getMyStudents_Inherited);


export default router;