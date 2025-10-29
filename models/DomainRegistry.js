import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// Stores valid domains and associates them with a unique college ID (Tenant ID)
export const DomainRegistry = sequelize.define('DomainRegistry', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  // The email domain (e.g., 'college.edu', 'department.ac.in')
  domain: { type: DataTypes.STRING, allowNull: false, unique: true }, 
  
  // The unique identifier for this college/tenant
  collegeId: { type: DataTypes.STRING, allowNull: false, unique: true }, 

  // Status (e.g., 'Active', 'Pending Verification')
  status: { type: DataTypes.ENUM('Active', 'Pending'), defaultValue: 'Pending' }
});