import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const Affiliation = sequelize.define('Affiliation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // RequestorId (e.g., StudentId) will be added by associations
  // ApproverId (e.g., FacultyId) will be added by associations
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('student_to_faculty', 'faculty_to_hod'),
    allowNull: false
  }
});