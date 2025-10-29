import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './User.js';
import { Exam } from './Exam.js';

export const ExamInstance = sequelize.define('ExamInstance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  // Link to the User (Student) and the Exam definition
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  examId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Exam, key: 'id' } },

  // Exam Session Lifecycle State 
  status: { 
    type: DataTypes.ENUM('Scheduled', 'Precheck', 'InProgress', 'Submitted', 'Grading', 'Completed', 'Published'),
    defaultValue: 'Scheduled',
    allowNull: false
  },

  // Secure / Anti-cheating fields [cite: 148, 157]
  paperHash: { type: DataTypes.STRING, allowNull: true, comment: 'Hash of the randomized paper structure delivered to the student' },
  proctoringWallet: { type: DataTypes.JSONB, allowNull: true, comment: 'Stores pre-check artifacts (ID photo, device fingerprint)' },
  integrityIndex: { type: DataTypes.FLOAT, defaultValue: 100.0, comment: 'Automated integrity score (0-100) for review prioritization' },

  // Timing
  startTs: { type: DataTypes.DATE, allowNull: true, comment: 'Timestamp when the student started the exam' },
  endTs: { type: DataTypes.DATE, allowNull: true, comment: 'Timestamp when the exam instance was submitted' },
});

// Define Associations

Exam.hasMany(ExamInstance, { foreignKey: 'examId' });
ExamInstance.belongsTo(Exam, { foreignKey: 'examId' });