import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { User } from './User.js';

export const Exam = sequelize.define('Exam', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  duration: { type: DataTypes.INTEGER, allowNull: false },
  totalMarks: { type: DataTypes.INTEGER, allowNull: false },
  
  timeWindow: { 
    type: DataTypes.JSONB, 
    allowNull: true, 
    comment: 'Scheduling start/end times (FR4)' 
  },
  
  // blueprint: { type: DataTypes.JSON, allowNull: true }, // <-- REMOVE THIS LINE
  
  policy: { 
    type: DataTypes.JSONB, 
    allowNull: true, 
    comment: 'Anti-cheating and access policies (FR4)' 
  },
  
  facultyId: { // <-- Ensure facultyId exists
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Users', key: 'id' }
  }
});

