import { ProctoringLog } from '../models/ProctoringLog.js';
import { ExamInstance } from '../models/ExamInstance.js';

// Log a violation
export const logViolation = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { instanceId } = req.params;
        const { type, timestamp } = req.body; // e.g., type: 'tab_switch'

        // Verify the student owns this exam instance
        const instance = await ExamInstance.findOne({ 
            where: { id: instanceId, userId: studentId } 
        });

        if (!instance) {
            return res.status(404).json({ message: 'Exam instance not found or access denied.' });
        }
        
        // Log the violation
        await ProctoringLog.create({
            examInstanceId: instanceId,
            studentId: studentId,
            violationType: type,
            timestamp: timestamp || new Date()
        });

        res.status(200).json({ message: 'Violation logged.' });

    } catch (error) {
        console.error('Error logging proctoring violation:', error);
        res.status(500).json({ error: 'Failed to log violation.' });
    }
};