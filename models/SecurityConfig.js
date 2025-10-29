import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

// This model stores the unique, changeable security code known only by the Admin/HOD
export const SecurityConfig = sequelize.define('SecurityConfig', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  
  // FINAL FIX: Removed 'defaultValue' to prevent the Postgres syntax error.
  keyName: { type: DataTypes.STRING, allowNull: false, unique: true }, 
  
  // The actual code set by the Admin/HOD
  codeValue: { type: DataTypes.STRING, allowNull: false },
  
  // User ID of the admin who last updated the code (for audit)
  updatedBy: { type: DataTypes.INTEGER, allowNull: true },
});