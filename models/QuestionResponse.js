import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { ExamInstance } from './ExamInstance.js';
import { QuestionVariant } from './QuestionVariant.js';

export const QuestionResponse = sequelize.define('QuestionResponse', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Links to the specific instance and the unique question variant the student saw
  examInstanceId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: ExamInstance, key: 'id' } 
  },
  questionVariantId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    references: { model: QuestionVariant, key: 'id' } 
  },

  // Student's answer (can be an index for MCQ, or text for Descriptive)
  answer: { type: DataTypes.JSONB, allowNull: true },

  // Grading Status
  isCorrect: { type: DataTypes.BOOLEAN, allowNull: true }, // For auto-grading
  marksAwarded: { type: DataTypes.FLOAT, defaultValue: 0.0 },

  timestamp: { type: DataTypes.DATE, allowNull: false }
});

// Define Associations
ExamInstance.hasMany(QuestionResponse, { foreignKey: 'examInstanceId' });
QuestionResponse.belongsTo(ExamInstance, { foreignKey: 'examInstanceId' });

QuestionVariant.hasOne(QuestionResponse, { foreignKey: 'questionVariantId' });
QuestionResponse.belongsTo(QuestionVariant, { foreignKey: 'questionVariantId' });