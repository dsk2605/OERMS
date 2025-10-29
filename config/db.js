import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // Load variables from .env file

let sequelize;

// Check if a DATABASE_URL environment variable is available (like on Render)
if (process.env.DATABASE_URL) {
  // --- This block is for RENDER (Production) ---
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // This is necessary for Render's free tier
      }
    },
    logging: false // Disable logging in production
  });
} else {
  // --- This block is for LOCAL Docker (Development) ---
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST,
      dialect: 'postgres',
      port: 5432,
      logging: false 
    }
  );
}

export { sequelize };