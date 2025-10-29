import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'faculty', 'student'), allowNull: false },
  
  // --- NEW FIELDS FOR ONBOARDING AND SCOPING ---
  // 1. Force Password Change Flag (for default passwords)
  mustChangePassword: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  
  // 2. College Identifier (for simplified scoping/multi-tenancy)
  collegeId: { type: DataTypes.STRING, allowNull: true, comment: 'Identifier for the user\'s college/tenant' }
});