import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Exam } from './Exam.js';

export const ExamResult = sequelize.define('ExamResult', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  score: { type: DataTypes.INTEGER, allowNull: false },
});

Exam.hasMany(ExamResult, { foreignKey: 'examId' });
ExamResult.belongsTo(Exam, { foreignKey: 'examId' });
