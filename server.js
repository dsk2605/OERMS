import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { sequelize } from './config/db.js';
import { setupAssociations } from './config/associations.js'; 
import authRoutes from './routes/authRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js'; // <-- NEW IMPORT
import proctorRoutes from './routes/proctorRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/proctor', proctorRoutes);
// --- New Route Integration ---
app.use('/api/admin', adminRoutes); // HOD Portal Routes
// -----------------------------
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);

const PORT = process.env.PORT || 5000;

// CRITICAL STEP: Set up all model associations BEFORE syncing the database.
setupAssociations(); 

sequelize.sync({ alter: true }).then(() => {
  console.log('Database connected & synced.');
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('Database sync error:', err));