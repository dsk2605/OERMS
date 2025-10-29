import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const ProctoringLog = sequelize.define('ProctoringLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  examInstanceId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'ExamInstances', key: 'id' } },
  studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  violationType: { type: DataTypes.STRING, allowNull: false }, // e.g., 'tab_switch', 'focus_loss'
  timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
});