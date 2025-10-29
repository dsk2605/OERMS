import { Question } from '../models/Question.js';
import { User } from '../models/User.js';
import { Affiliation } from '../models/Affiliation.js';
import { Exam } from '../models/Exam.js'; 
import { ExamResult } from '../models/ExamResult.js'; // Keep this import
import { ExamInstance } from '../models/ExamInstance.js'; // Keep this import
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';

// --- QUESTION MANAGEMENT (NOW Exam-Specific) ---

// REPLACED createQuestion logic (for Question Bank) with logic to add question TO AN EXAM
const createQuestion = async (req, res) => { 
    try {
        const facultyId = req.user.id; 
        const { examId } = req.params; // <-- CHANGED: Get examId from URL parameter
        // Include difficulty and tags if you kept them in the model, otherwise remove
        const { text, type, difficulty, tags, options, correctOption } = req.body;

        // 1. Verify faculty owns the exam
        const exam = await Exam.findOne({ where: { id: examId, facultyId: facultyId }, attributes: ['id'] });
        if (!exam) {
            return res.status(403).json({ message: 'Forbidden: You do not own this exam or it does not exist.' });
        }

        // 2. Validation
        if (!text || !type) { 
            return res.status(400).json({ message: 'Missing required question fields (text, type).' });
        }
        // Ensure options/correctOption are provided only for MCQs
        if (type === 'MCQ' && (!options || !correctOption || !Array.isArray(options) || options.length < 2)) {
             return res.status(400).json({ message: 'MCQ questions require options (array, min 2) and correctOption.' });
        }
        
        // 3. Create question linked TO THE EXAM
        const question = await Question.create({ 
            text, 
            type, 
            difficulty, // Optional field (if kept in model)
            tags,       // Optional field (if kept in model)
            options: type === 'MCQ' ? options : null, // Only save options for MCQ
            correctOption: type === 'MCQ' ? correctOption : null, // Only save correctOption for MCQ
            examId: examId, // <-- CHANGED: Link question directly to the exam
            createdBy: facultyId // <-- KEPT createdBy based on your model
        });

        res.status(201).json({ message: 'Question added successfully to the exam.', question });

    } catch (error) {
        console.error(`Error adding question to exam ${req.params.examId}:`, error);
        res.status(500).json({ error: 'Failed to add question.' });
    }
};

// REMOVED getQuestions (related to Question Bank)
// const getQuestions = async (req, res) => { /* ... Functionality removed ... */ };

// --- STUDENT PROVISIONING (Unchanged) ---
const provisionStudent = async (req, res) => { 
    try {
        const { studentEmail, studentName, collegeId } = req.body;
        const DEFAULT_PASSWORD = "PASS1234"; 
        const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        let user = await User.findOne({ where: { email: studentEmail } });
        if (user) {
            return res.status(409).json({ message: 'User already exists.' });
        }
        user = await User.create({
            name: studentName,
            email: studentEmail,
            password: hashed,
            role: 'student',
            collegeId: collegeId, 
            mustChangePassword: true, 
        });
        res.status(201).json({
            message: `Student account created. Default password is '${DEFAULT_PASSWORD}'.`,
            studentId: user.id
        });
    } catch (error) {
        console.error('Error provisioning student:', error);
        res.status(500).json({ error: 'Failed to provision student account.' });
    }
};


// --- EXAM MANAGEMENT ---

// MODIFIED createExam: Removed blueprint reference
const createExam = async (req, res) => { 
    try {
        const facultyId = req.user.id;
        // REMOVED blueprint from destructuring
        const { title, subject, date, duration, totalMarks, timeWindow, policy } = req.body; 

        // Updated validation (removed blueprint check, added totalMarks check)
        if (!title || !date || !duration || !totalMarks) {
            return res.status(400).json({ message: 'Missing required exam fields (title, date, duration, totalMarks).' });
        }

        const exam = await Exam.create({
            title, 
            subject, 
            date, 
            duration, 
            totalMarks, 
            timeWindow: timeWindow || null, 
            // Blueprint removed
            policy: policy || null, 
            facultyId: facultyId
        });

        // Updated success message
        res.status(201).json({ message: 'Exam created successfully. Add questions now.', exam }); 

    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: 'Failed to create exam.' });
    }
};

// --- NEW Exam-Specific Question Management Functions ---

// NEW FUNCTION: Get all questions for a specific exam owned by the faculty
const getExamQuestions = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { examId } = req.params;

        // Verify faculty owns the exam
        const exam = await Exam.findOne({ where: { id: examId, facultyId: facultyId }, attributes: ['id'] });
        if (!exam) {
            return res.status(403).json({ message: 'Forbidden: Exam access denied.' });
        }

        const questions = await Question.findAll({
            where: { examId: examId },
            order: [['id', 'ASC']] 
        });
        res.status(200).json(questions);
    } catch (error) {
        console.error(`Error fetching questions for exam ${req.params.examId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve questions.' });
    }
};

// REPLACED updateQuestion skeleton with full logic for Exam-Specific Question
const updateExamQuestion = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { examId, questionId } = req.params;
        const updates = req.body;

        // Verify faculty owns the exam
        const exam = await Exam.findOne({ where: { id: examId, facultyId: facultyId }, attributes: ['id'] });
        if (!exam) {
            return res.status(403).json({ message: 'Forbidden: Exam access denied.' });
        }
        
        // Find the specific question within that exam
        const question = await Question.findOne({ where: { id: questionId, examId: examId } });
        if (!question) {
            return res.status(404).json({ message: 'Question not found within this exam.' });
        }

        // Apply updates (excluding examId and createdBy as they shouldn't change)
        const { examId: excludedExamId, createdBy: excludedCreator, ...validUpdates } = updates; 
        
        // Ensure options/correctOption are nulled if type changes from MCQ
        if (validUpdates.type && validUpdates.type !== 'MCQ') {
            validUpdates.options = null;
            validUpdates.correctOption = null;
        } else if (validUpdates.type === 'MCQ' && (!validUpdates.options || !validUpdates.correctOption)) {
             return res.status(400).json({ message: 'MCQ questions require options and correctOption.' });
        }

        await question.update(validUpdates);
        res.status(200).json({ message: 'Question updated successfully.' });
    } catch (error) {
        console.error(`Error updating question ${req.params.questionId}:`, error);
        res.status(500).json({ error: 'Failed to update question.' });
    }
};

// REPLACED deleteQuestion skeleton with full logic for Exam-Specific Question
const deleteExamQuestion = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { examId, questionId } = req.params;

        // Verify faculty owns the exam
        const exam = await Exam.findOne({ where: { id: examId, facultyId: facultyId }, attributes: ['id'] });
        if (!exam) {
            return res.status(403).json({ message: 'Forbidden: Exam access denied.' });
        }

        // Delete the question if it belongs to this exam
        const result = await Question.destroy({
            where: { id: questionId, examId: examId }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Question not found within this exam.' });
        }

        res.status(200).json({ message: 'Question deleted successfully from the exam.' });

    } catch (error) {
        console.error(`Error deleting question ${req.params.questionId}:`, error);
        res.status(500).json({ error: 'Failed to delete question.' });
    }
};

const getAllHODs = async (req, res) => {
    try {
        const hodList = await User.findAll({
            where: { role: 'admin' }, // HODs have the 'admin' role
            attributes: ['id', 'name', 'email'] 
        });
        res.status(200).json(hodList);
    } catch (error) {
        console.error('Error fetching HOD list:', error);
        res.status(500).json({ error: 'Failed to retrieve HOD list.' });
    }
};

// NEW FUNCTION: Creates a 'pending' request from a faculty to an HOD
const requestHOD = async (req, res) => {
    try {
        const facultyId = req.user.id; // From authMiddleware
        const { hodId } = req.params; // From the URL

        const hod = await User.findOne({ where: { id: hodId, role: 'admin' } });
        if (!hod) {
            return res.status(404).json({ message: 'HOD not found.' });
        }

        // Check for existing request
        const existingRequest = await Affiliation.findOne({
            where: {
                RequestorId: facultyId,
                ApproverId: hodId,
                type: 'faculty_to_hod'
            }
        });

        if (existingRequest) {
            return res.status(409).json({ message: `Request already ${existingRequest.status}.` });
        }

        // Create the new 'pending' request
        await Affiliation.create({
            RequestorId: facultyId,
            ApproverId: hodId,
            type: 'faculty_to_hod',
            status: 'pending'
        });

        res.status(201).json({ message: 'Request to join HOD sent successfully.' });

    } catch (error) {
        console.error('Error sending HOD request:', error);
        res.status(500).json({ error: 'Failed to send request.' });
    }
};

// NEW FUNCTION: Gets all pending student requests for this faculty
const getStudentRequests = async (req, res) => {
    try {
        const facultyId = req.user.id;
        
        const requests = await Affiliation.findAll({
            where: {
                ApproverId: facultyId,
                type: 'student_to_faculty',
                status: 'pending'
            },
            // Include the student's info (the 'Requestor')
            include: [{
                model: User,
                as: 'Requestor',
                attributes: ['id', 'name', 'email']
            }]
        });
        
        res.status(200).json(requests);
    } catch (error) {
        console.error('Error fetching student requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests.' });
    }
};

// NEW FUNCTION: Approves or rejects a student's request
const manageStudentRequest = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { affiliationId } = req.params; // The ID of the request itself
        const { newStatus } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(newStatus)) {
            return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected".' });
        }

        const request = await Affiliation.findOne({
            where: {
                id: affiliationId,
                ApproverId: facultyId, // Ensure this faculty owns this request
                type: 'student_to_faculty'
            }
        });

        if (!request) {
            return res.status(404).json({ message: 'Request not found or you do not have permission.' });
        }

        request.status = newStatus;
        await request.save();

        res.status(200).json({ message: `Student request ${newStatus}.` });
    } catch (error) {
        console.error('Error managing student request:', error);
        res.status(500).json({ error: 'Failed to update request.' });
    }
};

// NEW FUNCTION: Gets a list of all students approved by this faculty
const getMyStudents = async (req, res) => {
    try {
        const facultyId = req.user.id;

        const approvedAffiliations = await Affiliation.findAll({
            where: {
                ApproverId: facultyId,
                type: 'student_to_faculty',
                status: 'approved'
            },
            include: [{
                model: User,
                as: 'Requestor',
                attributes: ['id', 'name', 'email']
            }]
        });

        // Re-format the data to be a clean list of students
        const students = approvedAffiliations.map(aff => aff.Requestor);
        
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching "my students":', error);
        res.status(500).json({ error: 'Failed to fetch students.' });
    }
};

// NEW FUNCTION: Bulk provision students from a list of emails
const bulkProvisionStudents = async (req, res) => {
    const { emails } = req.body; // Expecting an array of email strings
    const facultyId = req.user.id; // Faculty performing the action

    if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: 'Email list must be a non-empty array.' });
    }

    const results = {
        success: [],
        failed: [],
    };

    const DEFAULT_PASSWORD = "PASS1234";
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    for (const email of emails) {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) continue; // Skip empty lines

        try {
            // Try to extract a name from the email (e.g., "john.doe" from "john.doe@example.com")
            const namePart = trimmedEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const studentName = namePart || "New Student"; // Fallback name

            // Check if user already exists
            const existingUser = await User.findOne({ where: { email: trimmedEmail } });
            if (existingUser) {
                results.failed.push({ email: trimmedEmail, reason: 'Already exists' });
                continue;
            }

            // Create the student account
            const newUser = await User.create({
                name: studentName,
                email: trimmedEmail,
                password: hashedPassword,
                role: 'student',
                mustChangePassword: true,
                // Optionally link to the faculty's collegeId if available
                // collegeId: req.user.collegeId, 
            });
            results.success.push({ email: trimmedEmail, id: newUser.id });

        } catch (error) {
            console.error(`Error provisioning ${trimmedEmail}:`, error);
            results.failed.push({ email: trimmedEmail, reason: error.message || 'Server error' });
        }
    }

    res.status(200).json({
        message: `Bulk provisioning complete. Success: ${results.success.length}, Failed: ${results.failed.length}.`,
        details: results
    });
};

const getMyCreatedExams = async (req, res) => {
    try {
        const facultyId = req.user.id; // Get ID from login token
        const exams = await Exam.findAll({
            where: { facultyId: facultyId }, // Find exams where facultyId matches
            order: [['date', 'DESC']] // Show most recent first
        });
        res.status(200).json(exams);
    } catch (error) {
         console.error('Error fetching faculty exams:', error);
         res.status(500).json({ error: 'Failed to retrieve created exams.' });
    }
};

const updateExam = async (req, res) => {
    try {
        const examId = req.params.id;
        const facultyId = req.user.id;
        // REMOVED blueprint from destructuring
        const { blueprint, ...updates } = req.body; 

        const exam = await Exam.findOne({ where: { id: examId, facultyId: facultyId } });
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found or you do not have permission to edit.' });
        }
        
        // No need to handle blueprint JSON conversion anymore
        
        await exam.update(updates);
        res.status(200).json({ message: 'Exam updated successfully.' });

    } catch (error) {
        console.error('Error updating exam:', error);
        res.status(500).json({ error: 'Failed to update exam.' });
    }
};
const deleteExam = async (req, res) => {
    try {
        const examId = req.params.id;
        const facultyId = req.user.id;

        const result = await Exam.destroy({
            where: { id: examId, facultyId: facultyId }
        });

        if (result === 0) {
            return res.status(404).json({ message: 'Exam not found or you do not have permission to delete.' });
        }

        res.status(200).json({ message: 'Exam deleted successfully.' });

    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ error: 'Failed to delete exam.' });
    }
};

const getExamSubmissions = async (req, res) => {
    try {
        const facultyId = req.user.id;
        
        // Find exams created by this faculty
        const facultyExams = await Exam.findAll({
            where: { facultyId: facultyId },
            attributes: ['id']
        });
        const examIds = facultyExams.map(e => e.id);

        if (examIds.length === 0) {
            return res.status(200).json([]);
        }

        // Find all submissions for those exams
        const submissions = await ExamResult.findAll({
            where: {
                examId: { [Op.in]: examIds }
            },
            // Include Student info and Exam info
            include: [
                { model: User, as: 'student', attributes: ['name', 'email'] },
                { model: Exam, as: 'exam', attributes: ['title', 'totalMarks'] },
                { model: ExamInstance, as: 'examInstance', attributes: ['status', 'startTs', 'endTs'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json(submissions);

    } catch (error) {
        console.error('Error fetching exam submissions:', error);
        res.status(500).json({ error: 'Failed to retrieve submissions.' });
    }
};

// --- REMOVED Question Bank Count Function ---
// const getQuestionCount = async (req, res) => { /* ... REMOVED ... */ };

// --- Corrected EXPORT Block ---
export { 
    // Exam Management
    createExam,         // Updated (no blueprint)
    updateExam,         // Updated (no blueprint)
    deleteExam, 
    getMyCreatedExams,
    
    // Exam-Specific Question Management
    createQuestion,         // Replaced old one
    getExamQuestions,       // New
    updateExamQuestion,     // Replaced old updateQuestion skeleton
    deleteExamQuestion,     // Replaced old deleteQuestion skeleton

    // Hierarchy & Student Management
    getAllHODs, 
    requestHOD, 
    getStudentRequests, 
    manageStudentRequest, 
    getMyStudents,
    bulkProvisionStudents,
    provisionStudent, // Keep if using single add
    
    // Results Viewing
    getExamSubmissions
    
    // REMOVED getQuestions and getQuestionCount
};