import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Exam } from './Exam.js'; 
// We import User if keeping createdBy, otherwise remove it
import { User } from './User.js'; // Assuming User model is here

export const Question = sequelize.define('Question', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: DataTypes.STRING, allowNull: false },
  type: { 
    type: DataTypes.ENUM('MCQ', 'Descriptive'), // Removed 'Numeric' for simplicity unless needed
    allowNull: false 
  },
  // Optional fields (keep if useful, remove if not)
  difficulty: { 
    type: DataTypes.ENUM('Easy', 'Medium', 'Hard'), 
    allowNull: true // Make optional if blueprint is gone
  },
  tags: { 
    type: DataTypes.ARRAY(DataTypes.STRING), 
    allowNull: true
  },
  // --- MCQ Fields ---
  options: { 
    type: DataTypes.ARRAY(DataTypes.STRING), 
    allowNull: true // Only for MCQs
  },
  correctOption: { 
    type: DataTypes.STRING, // Correct type
    allowNull: true // Only for MCQs
  },

  // --- CHANGES ---
  // 1. examId is now MANDATORY
  examId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, // <-- Set to false (Required)
    references: { model: 'Exams', key: 'id' },
    onDelete: 'CASCADE' // Optional: Delete questions if exam is deleted
  },
  
  // 2. createdBy is now OPTIONAL (remove if not needed)
  createdBy: { 
    type: DataTypes.INTEGER, 
    allowNull: true, // <-- Make optional or remove field entirely
    references: { model: 'Users', key: 'id' } 
  } 
  // --- END CHANGES ---
});
Exam.hasMany(Question, { foreignKey: 'examId' }); 
