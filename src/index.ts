import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import collegeRoutes from './routes/colleges';
import authRoutes from './routes/auth';  
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test DB connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('DB Connection Error:', err.message);
  } else {
    console.log('Database connected successfully!');
    release();
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'College API is running!' });
});

app.use('/api/colleges', collegeRoutes);
app.use('/api/auth', authRoutes);
// Keep process alive
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});