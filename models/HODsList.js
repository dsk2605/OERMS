import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// Stores emails approved by the college authority to receive Admin role.
export const HODsList = sequelize.define('HODsList', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  // The full email address (e.g., 'nilakshi.jain@sakec.ac.in')
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  
  // Scoping field (links to DomainRegistry/College)
  collegeId: { type: DataTypes.STRING, allowNull: false }, 
  
  // Role to assign (usually 'admin')
  roleToAssign: { type: DataTypes.ENUM('admin', 'faculty'), defaultValue: 'admin' },
});