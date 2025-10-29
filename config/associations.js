// config/associations.js

import { User } from '../models/User.js';
import { Exam } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { ExamInstance } from '../models/ExamInstance.js';
import { ExamResult } from '../models/ExamResult.js';
import { QuestionVariant } from '../models/QuestionVariant.js';
import { QuestionResponse } from '../models/QuestionResponse.js';
import { Affiliation } from '../models/Affiliation.js';
import { ProctoringLog } from '../models/ProctoringLog.js';

export const setupAssociations = () => {
    // --- Existing Exam Workflow Associations ---
    ExamInstance.hasMany(QuestionVariant, { foreignKey: 'examInstanceId' });
    QuestionVariant.belongsTo(ExamInstance, { foreignKey: 'examInstanceId' });
    ExamInstance.hasMany(QuestionResponse, { foreignKey: 'examInstanceId' });
    QuestionResponse.belongsTo(ExamInstance, { foreignKey: 'examInstanceId' });
    QuestionVariant.belongsTo(Question, { foreignKey: 'questionId' });
    Question.hasMany(QuestionVariant, { foreignKey: 'questionId' });
    QuestionVariant.hasOne(QuestionResponse, { foreignKey: 'questionVariantId' });
    QuestionResponse.belongsTo(QuestionVariant, { foreignKey: 'questionVariantId' });
// --- Results ---
    ExamResult.belongsTo(ExamInstance, { as: 'examInstance', foreignKey: 'examInstanceId' });
    ExamInstance.hasOne(ExamResult, { as: 'examInstance', foreignKey: 'examInstanceId' });

    // --- ADDED: Exam <-> Question Association ---
    // (An Exam has many Questions, a Question belongs to one Exam)
    Exam.hasMany(Question, { foreignKey: 'examId', onDelete: 'CASCADE' }); // Added onDelete
    Question.belongsTo(Exam, { foreignKey: 'examId' });
    // --- END ADDED ---

    // --- ADDED: User (Faculty) <-> Exam Association ---
    // (An Exam belongs to one Faculty, a Faculty can create many Exams)
    Exam.belongsTo(User, { as: 'faculty', foreignKey: 'facultyId' });
    User.hasMany(Exam, { foreignKey: 'facultyId' });
    // --- END ADDED ---

    // --- ADDED: User (Student) <-> ExamResult/ExamInstance ---
    // (A Result belongs to one Student, a Student can have many Results)
    ExamResult.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
    User.hasMany(ExamResult, { foreignKey: 'studentId' });
    // (An Instance belongs to one Student, a Student can have many Instances)
    ExamInstance.belongsTo(User, { as: 'student', foreignKey: 'userId' }); // Assuming 'userId' is the FK in ExamInstance
    User.hasMany(ExamInstance, { foreignKey: 'userId' });
    // --- END ADDED ---

     // --- ADDED: Exam <-> ExamResult/ExamInstance ---
     // (A Result belongs to one Exam, an Exam can have many Results)
     ExamResult.belongsTo(Exam, { as: 'exam', foreignKey: 'examId'});
     Exam.hasMany(ExamResult, {foreignKey: 'examId'});
     // (An Instance belongs to one Exam, an Exam can have many Instances)
     ExamInstance.belongsTo(Exam, {as: 'exam', foreignKey: 'examId'});
     Exam.hasMany(ExamInstance, {foreignKey: 'examId'});
     // --- END ADDED ---

    // --- Hierarchy Associations ---
    User.hasMany(Affiliation, { foreignKey: 'RequestorId', as: 'SentRequests' });
    Affiliation.belongsTo(User, { foreignKey: 'RequestorId', as: 'Requestor' });
    User.hasMany(Affiliation, { foreignKey: 'ApproverId', as: 'ReceivedRequests' });
    Affiliation.belongsTo(User, { foreignKey: 'ApproverId', as: 'Approver' });

    // --- Proctoring Log Associations ---
    ExamInstance.hasMany(ProctoringLog, { foreignKey: 'examInstanceId' });
    ProctoringLog.belongsTo(ExamInstance, { foreignKey: 'examInstanceId' });

    User.hasMany(ProctoringLog, { foreignKey: 'studentId' });
    ProctoringLog.belongsTo(User, { foreignKey: 'studentId' });
};