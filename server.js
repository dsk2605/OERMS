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
import { DomainRegistry } from './models/DomainRegistry.js';
import { HODsList } from './models/HODsList.js';
// ... (keep other imports like express, cors, sequelize, etc.)

dotenv.config();
const app = express();


// --- MODIFIED CORS Setup (More Robust) ---
const corsOptions = {
  origin: [
    'http://localhost:3000',      // For local testing
    'https://dsk2605.github.io' // For your live frontend
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow all common methods
  preflightContinue: false,
  optionsSuccessStatus: 204 // Respond to OPTIONS with 204 (No Content)
};

// Enable CORS for all routes
app.use(cors(corsOptions));

// Explicitly handle pre-flight (OPTIONS) requests
app.options('*', cors(corsOptions));
// ----------------------------------------
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
const setupInitialData = async () => {
    try {
        // 1. Check for the domain
        const domain = await DomainRegistry.findOrCreate({
            where: { domain: 'sakec.ac.in' },
            defaults: {
                domain: 'sakec.ac.in',
                collegeId: 'SAKEC',
                status: 'Active'
            }
        });

        if (domain[1]) { // domain[1] is true if a new record was created
            console.log('Added sakec.ac.in to DomainRegistry.');
        }

        // 2. Check for the HOD permission
        const hod = await HODsList.findOrCreate({
            where: { email: 'nilakshi.jain@sakec.ac.in' },
            defaults: {
                email: 'nilakshi.jain@sakec.ac.in',
                collegeId: 'SAKEC',
                roleToAssign: 'admin'
            }
        });

        if (hod[1]) {
            console.log('Added nilakshijain@sakec.ac.in to HODsLists.');
        }

    } catch (error) {
        console.error('Error setting up initial data:', error);
    }
};

sequelize.sync({ alter: true }).then(async() => {
  console.log('Database connected & synced.');
  await setupInitialData();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.error('Database sync error:', err));

