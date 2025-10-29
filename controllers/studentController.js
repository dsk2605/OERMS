import { User } from '../models/User.js';
import { Affiliation } from '../models/Affiliation.js';
import { Exam } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { ExamInstance } from '../models/ExamInstance.js';
import { QuestionVariant } from '../models/QuestionVariant.js'; 
import { ExamResult } from '../models/ExamResult.js'; // <-- NEW IMPORT
import { QuestionResponse } from '../models/QuestionResponse.js'; // <-- NEW IMPORT
import { Op } from 'sequelize';
import crypto from 'crypto'; 
import { sequelize } from '../config/db.js'; // <-- ADD THIS LINE

// Helper function to handle randomization (FR5 logic)
const generateRandomPaper = async (examId, blueprint) => {
    const paper = [];
    // Loop through each rule defined in the blueprint (e.g., 10 Easy MCQs on CO1)
    for (const rule of blueprint) {
        // 1. Find all questions that match the rule (type, difficulty, and tags)
        const matchingQuestions = await Question.findAll({
            where: {
                type: rule.type,
                difficulty: rule.difficulty,
                // Check if the question's 'tags' array contains ALL of the rule's 'tags'
                tags: { [Op.contains]: rule.tags }
            }
        });

        if (matchingQuestions.length < rule.count) {
            // FR5 Validation: Not enough questions match the blueprint
            throw new Error(`Insufficient questions found for rule: ${JSON.stringify(rule)}`);
        }

        // 2. Select a random sample of 'count' questions (core randomization)
        const shuffledQuestions = matchingQuestions.sort(() => 0.5 - Math.random());
        const selectedQuestions = shuffledQuestions.slice(0, rule.count);

        // 3. Process selected questions into variants (for uniqueness/parameterization)
        for (const question of selectedQuestions) {
            let variantData = {
                questionId: question.id,
                paramValues: null, 
                correctAnswerValue: question.correctOption 
            };
            paper.push(variantData);
        }
    }
    return paper; 
};

// --- REPLACE your old startExam function with this ---
const startExam = async (req, res) => {
    // Use the sequelize instance associated with the Exam model for transaction
    const transaction = await sequelize.transaction(); 
    try {
        const studentId = req.user.id;
        const examId = req.params.id;
        const currentTime = new Date();

        // 1. Find Exam
        const exam = await Exam.findByPk(examId);
        if (!exam) {
            await transaction.rollback(); // Rollback before returning
            return res.status(404).json({ message: 'Exam not found' });
        }

        // 2. Security Check: Ensure student is approved by the faculty who owns this exam
        const facultyId = exam.facultyId;
        const isApproved = await Affiliation.findOne({ 
            where: { 
                RequestorId: studentId, 
                ApproverId: facultyId, 
                type: 'student_to_faculty', 
                status: 'approved' 
            } 
        });
        if (!isApproved) {
            await transaction.rollback();
            return res.status(403).json({ message: 'You are not enrolled for this exam.' });
        }
        
        // 3. Check if already started/submitted
        const existingInstance = await ExamInstance.findOne({ where: { examId, userId: studentId } });
        if (existingInstance) {
           await transaction.rollback();
           return res.status(400).json({ message: `Exam instance already exists. Status: ${existingInstance.status}` });
        }

        // --- Blueprint logic REMOVED ---

        // 4. Fetch ALL questions linked directly to this exam
        const questionsForExam = await Question.findAll({
            where: { examId: examId },
            order: sequelize.random() // Shuffle question order for each student
        });

        if (questionsForExam.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: 'This exam currently has no questions.' });
        }

        // 5. Prepare Question Variants for ALL fetched questions
        const paperStructure = questionsForExam.map(question => ({
            questionId: question.id,
            paramValues: null, // Keep null if not using parameterized questions
            correctAnswerValue: question.correctOption // Still needed for auto-grading MCQs
        }));
        
        // 6. Calculate paper hash and total questions
        const paperHash = crypto.createHash('sha256').update(JSON.stringify(paperStructure)).digest('hex');
        const totalQuestions = paperStructure.length;

        // 7. Create Exam Instance
        const instance = await ExamInstance.create({
            examId: examId,
            userId: studentId,
            status: 'InProgress', 
            paperHash: paperHash, 
            startTs: currentTime, 
        }, { transaction });

        // 8. Create Question Variants linked to the instance
        const variants = paperStructure.map(q => ({
            ...q,
            examInstanceId: instance.id
        }));
        await QuestionVariant.bulkCreate(variants, { transaction });

        // 9. Commit transaction
        await transaction.commit();

        res.status(201).json({
            message: 'Exam started successfully. Timer started.',
            examInstanceId: instance.id,
            totalQuestions: totalQuestions,
        });

    } catch (error) {
        // Ensure rollback happens on any error
        await transaction.rollback(); 
        console.error('Error starting exam:', error);
        res.status(500).json({ error: 'Failed to start exam.' });
    }
};

// DFD Process 3 & 4: Exam Submission and Auto-Grading (FR8, FR9, FR10)
 const submitExam = async (req, res) => { // <-- IMPLEMENTATION STARTS HERE
    const transaction = await Exam.sequelize.transaction();
    try {
        const studentId = req.user.id;
        const examInstanceId = req.params.id;
        const { responses } = req.body; // Array of { questionVariantId, answer }

        // 1. Check Exam Instance Status
       const instance = await ExamInstance.findByPk(examInstanceId, { 
       include: [{ model: QuestionVariant, include: [ { model: Question } ] }] // <-- CRITICAL FIX: Use model object for deep include
       });
        if (!instance) return res.status(404).json({ message: 'Exam instance not found.' });
        if (instance.status === 'Submitted') {
            return res.status(400).json({ message: 'Exam already submitted.' });
        }

        let totalScore = 0;
        let objectiveQuestionsCount = 0;
        let correctObjectiveCount = 0;
        
        // Map variants for quick lookup 
        const variantsMap = new Map(instance.QuestionVariants.map(v => [v.id, v]));

        // 2. Process and Save Responses (FR8: Auto-save/Sync)
        for (const resData of responses) {
            const variant = variantsMap.get(resData.questionVariantId);
            if (!variant) continue;

            let isCorrect = null; // null for descriptive
            let marksAwarded = 0;

            // 3. Auto-Grade Objective Questions (FR9)
            if (variant.Question.type === 'MCQ') { 
                objectiveQuestionsCount++;
                // Check if the submitted answer matches the correct answer value saved in the variant
                // Note: The structure of variant.Question.options is not needed here, only variant.correctAnswerValue
                if (String(resData.answer) === String(variant.correctAnswerValue)) {
                    isCorrect = true;
                    marksAwarded = 1; // Assuming a base 1 mark per MCQ for simplicity
                    correctObjectiveCount++;
                    totalScore += marksAwarded;
                } else {
                    isCorrect = false;
                }
            }
            
            // Save the student's response in the QuestionResponse table
            await QuestionResponse.create({
                examInstanceId: instance.id,
                questionVariantId: variant.id,
                answer: resData.answer,
                isCorrect: isCorrect,
                marksAwarded: marksAwarded,
                timestamp: new Date()
            }, { transaction });
        }

        // 4. Update Exam Instance Status (State Diagram: InProgress -> Submitted)
        await instance.update({
            status: 'Submitted',
            endTs: new Date() 
        }, { transaction });

        // 5. Create/Update Exam Result (FR10)
        await ExamResult.upsert({
            examInstanceId: instance.id,
            studentId: studentId,
            examId: instance.examId,
            score: totalScore,
            // Descriptive answers are pending manual grading.
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message: 'Exam successfully submitted and auto-grading initiated.',
            status: 'Submitted',
            objectiveScore: totalScore,
            objectiveCorrect: correctObjectiveCount,
            totalQuestionsSubmitted: responses.length
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error submitting exam:', error);
        res.status(500).json({ error: 'Failed to submit exam.' });
    }
};

// Placeholder for Student Exam Submission
const getScheduledExams = async (req, res) => {
    res.status(501).json({ message: 'Not Implemented: Get scheduled exams' });
};

// NEW FUNCTION: Gets a list of all faculty for students to see
const getAllFaculty = async (req, res) => {
    try {
        const facultyList = await User.findAll({
            where: { role: 'faculty' },
            attributes: ['id', 'name', 'email'] // Only send public, non-sensitive data
        });
        res.status(200).json(facultyList);
    } catch (error) {
        console.error('Error fetching faculty list:', error);
        res.status(500).json({ error: 'Failed to retrieve faculty list.' });
    }
};

// NEW FUNCTION: Creates a 'pending' request from a student to a faculty
const requestFaculty = async (req, res) => {
    try {
        const studentId = req.user.id; // From authMiddleware
        const { facultyId } = req.params; // From the URL (e.g., /api/student/request-faculty/12)

        // Check if this faculty member exists and is actually a faculty member
        const faculty = await User.findOne({ where: { id: facultyId, role: 'faculty' } });
        if (!faculty) {
            return res.status(404).json({ message: 'Faculty member not found.' });
        }

        // Check if a request has already been sent
        const existingRequest = await Affiliation.findOne({
            where: {
                RequestorId: studentId,
                ApproverId: facultyId,
                type: 'student_to_faculty'
            }
        });

        if (existingRequest) {
            return res.status(409).json({ message: `Request already ${existingRequest.status}.` });
        }

        // Create the new 'pending' request
        await Affiliation.create({
            RequestorId: studentId,
            ApproverId: facultyId,
            type: 'student_to_faculty',
            status: 'pending'
        });

        res.status(201).json({ message: 'Enrollment request sent successfully.' });

    } catch (error) {
        console.error('Error sending enrollment request:', error);
        res.status(500).json({ error: 'Failed to send request.' });
    }
};

const getMyExams = async (req, res) => {
    try {
        const studentId = req.user.id;

        // 1. Find all approved affiliations for this student
        const approvedAffiliations = await Affiliation.findAll({
            where: {
                RequestorId: studentId,
                type: 'student_to_faculty',
                status: 'approved'
            },
            attributes: ['ApproverId'] // We only need the faculty IDs
        });

        const facultyIds = approvedAffiliations.map(aff => aff.ApproverId);

        if (facultyIds.length === 0) {
            // If the student isn't approved by any faculty, return empty list
            return res.status(200).json([]); 
        }

        // 2. Find all exams created by those faculty
        const relevantExams = await Exam.findAll({
            where: {
                facultyId: { [Op.in]: facultyIds } 
                // Optionally add date filters, e.g., only show upcoming exams
                // date: { [Op.gte]: new Date() } 
            },
            include: [{ // Include faculty name with the exam
                model: User,
                as: 'faculty', // Make sure this alias matches your Exam model definition
                attributes: ['id', 'name']
            }],
            order: [['date', 'ASC']] // Show upcoming exams first
        });

        res.status(200).json(relevantExams);

    } catch (error) {
        console.error('Error fetching student exams:', error);
        res.status(500).json({ error: 'Failed to retrieve exams.' });
    }
};

const getMyApprovedFaculty = async (req, res) => {
    try {
        const studentId = req.user.id;

        const approvedAffiliations = await Affiliation.findAll({
            where: {
                RequestorId: studentId,
                type: 'student_to_faculty',
                status: 'approved'
            },
            // Include the faculty's (Approver's) details
            include: [{
                model: User,
                as: 'Approver', 
                attributes: ['id', 'name', 'email'] 
            }]
        });

        // Extract just the faculty info from the affiliations
        const facultyList = approvedAffiliations.map(aff => aff.Approver);
        
        res.status(200).json(facultyList);

    } catch (error) {
        console.error('Error fetching approved faculty:', error);
        res.status(500).json({ error: 'Failed to retrieve faculty list.' });
    }
};

const getExamsByFaculty = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { facultyId } = req.params; // Get faculty ID from the URL

        // 1. Security Check: Verify the student is actually approved by this faculty
        const isApproved = await Affiliation.findOne({
            where: {
                RequestorId: studentId,
                ApproverId: facultyId,
                type: 'student_to_faculty',
                status: 'approved'
            }
        });

        if (!isApproved) {
            return res.status(403).json({ message: 'Forbidden: You are not enrolled with this faculty.' });
        }

        // 2. Fetch exams created by this specific faculty
        // We can add filters for upcoming/past later
        const exams = await Exam.findAll({
            where: {
                facultyId: facultyId 
                // Example: Only upcoming
                // date: { [Op.gte]: new Date() } 
            },
             include: [{ // Include faculty name with the exam
                model: User,
                as: 'faculty', // Ensure alias matches Exam model
                attributes: ['id', 'name']
            }],
            order: [['date', 'ASC']]
        });

        res.status(200).json(exams);

    } catch (error) {
        console.error(`Error fetching exams for faculty ${req.params.facultyId}:`, error);
        res.status(500).json({ error: 'Failed to retrieve exams.' });
    }
};

// NEW FUNCTION: Gets the specific set of questions for an exam instance
const getExamQuestions = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { instanceId } = req.params;

        // 1. Find the exam instance and verify the student owns it
        const instance = await ExamInstance.findOne({
            where: {
                id: instanceId,
                userId: studentId // SECURITY CHECK
            }
        });

        if (!instance) {
            return res.status(404).json({ message: 'Exam instance not found or you do not have access.' });
        }
        
        if (instance.status !== 'InProgress') {
            return res.status(403).json({ message: `This exam is already ${instance.status}.`});
        }

        // 2. Find all QuestionVariants for this instance
        //    and include the full Question data (text, options, type)
        const variants = await QuestionVariant.findAll({
            where: { examInstanceId: instance.id },
            include: [{
                model: Question, // Include the original question data
                attributes: ['text', 'type', 'options'] // Only send needed fields
            }],
            order: [['id', 'ASC']] // Keep questions in a consistent order
        });

        if (!variants || variants.length === 0) {
            return res.status(404).json({ message: 'Could not find questions for this exam.' });
        }

        res.status(200).json(variants);

    } catch (error) {
        console.error('Error fetching exam questions:', error);
        res.status(500).json({ error: 'Failed to retrieve exam questions.' });
    }
};
// EXPORT ALL FUNCTIONS
// EXPORT ALL FUNCTIONS
export { 
    generateRandomPaper, // Helper, useful for testing
    startExam, 
    submitExam,
    getScheduledExams,
    getAllFaculty, 
    requestFaculty,
    getMyExams,
    getMyApprovedFaculty,
    getExamsByFaculty,
    getExamQuestions     
};