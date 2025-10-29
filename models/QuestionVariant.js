import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Question } from './Question.js';
import { ExamInstance } from './ExamInstance.js';

export const QuestionVariant = sequelize.define('QuestionVariant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Link back to the base question and the specific exam instance it belongs to
  questionId: { type: DataTypes.INTEGER, allowNull: false, references: { model: Question, key: 'id' } },
  examInstanceId: { type: DataTypes.INTEGER, allowNull: false, references: { model: ExamInstance, key: 'id' } },

  // Stores the unique parameters (e.g., { "A": 10, "B": 20 }) for parameterized questions 
  paramValues: { type: DataTypes.JSONB, allowNull: true }, 

  // Stores the calculated correct answer (for numeric auto-grading)
  correctAnswerValue: { type: DataTypes.STRING, allowNull: true },

  // Track if this variant has been graded/reviewed
  isGraded: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Define Associations
Question.hasMany(QuestionVariant, { foreignKey: 'questionId' });
QuestionVariant.belongsTo(Question, { foreignKey: 'questionId' });

ExamInstance.hasMany(QuestionVariant, { foreignKey: 'examInstanceId' });
QuestionVariant.belongsTo(ExamInstance, { foreignKey: 'examInstanceId' });