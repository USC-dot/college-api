import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../index';
import { validate } from '../middleware/validate';
import { registerValidator, loginValidator } from '../validators/authValidators';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'college_secret_key';

// Register
router.post('/register', registerValidator, validate, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existing = await pool.query(
      `SELECT * FROM users WHERE email = $1`, [email]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered!' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', loginValidator, validate, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`, [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password!' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password!' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get saved colleges
router.get('/saved', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded: any = jwt.verify(token, JWT_SECRET);

    const result = await pool.query(
      `SELECT c.* FROM colleges c
       JOIN saved_colleges sc ON sc.college_id = c.id
       WHERE sc.user_id = $1`,
      [decoded.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save a college
router.post('/saved/:collegeId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const { collegeId } = req.params;

    // Check if already saved
    const existing = await pool.query(
      `SELECT * FROM saved_colleges WHERE user_id = $1 AND college_id = $2`,
      [decoded.id, collegeId]
    );

    if (existing.rows.length > 0) {
      // Unsave
      await pool.query(
        `DELETE FROM saved_colleges WHERE user_id = $1 AND college_id = $2`,
        [decoded.id, collegeId]
      );
      return res.json({ saved: false });
    }

    // Save
    await pool.query(
      `INSERT INTO saved_colleges (user_id, college_id) VALUES ($1, $2)`,
      [decoded.id, collegeId]
    );

    res.json({ saved: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;