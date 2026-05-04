import { Router } from 'express';
import { pool } from '../index';

import { validate } from '../middleware/validate';
import { 
  searchValidator, 
  idValidator, 
  questionValidator, 
  answerValidator,
  predictorValidator 
} from '../validators/collegeValidators';

const router = Router();

// 1️⃣ GET all colleges
router.get('/', searchValidator, validate, async (req, res) => {
  try {
    const { search, state, type, fees_max } = req.query;
    let query = `SELECT * FROM colleges WHERE 1=1`;
    const params: any[] = [];
    let count = 1;
    if (search) { query += ` AND name ILIKE $${count}`; params.push(`%${search}%`); count++; }
    if (state) { query += ` AND state = $${count}`; params.push(state); count++; }
    if (type) { query += ` AND type = $${count}`; params.push(type); count++; }
    if (fees_max) { query += ` AND fees_min <= $${count}`; params.push(fees_max); count++; }
    query += ` ORDER BY rating DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2️⃣ Predictor (BEFORE /:id)
router.get('/predictor/results', predictorValidator, validate, async (req, res) => {
  try {
    const { exam, rank } = req.query;
    let query = `SELECT * FROM colleges WHERE 1=1`;
    const params: any[] = [];
    let count = 1;
    if (exam === 'JEE') {
      if (Number(rank) <= 1000) { query += ` AND rating >= $${count}`; params.push(4.5); count++; }
      else if (Number(rank) <= 5000) { query += ` AND rating >= $${count}`; params.push(4.0); count++; }
      else if (Number(rank) <= 20000) { query += ` AND rating >= $${count}`; params.push(3.5); count++; }
      else { query += ` AND rating >= $${count}`; params.push(3.0); count++; }
      query += ` AND type = $${count}`; params.push('Government'); count++;
    } else if (exam === 'BITSAT') {
      if (Number(rank) <= 100) { query += ` AND rating >= $${count}`; params.push(4.4); count++; }
      else { query += ` AND rating >= $${count}`; params.push(3.8); count++; }
    } else {
      query += ` AND type = $${count}`; params.push('Private'); count++;
    }
    query += ` ORDER BY rating DESC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3️⃣ Get questions (BEFORE /:id)
router.get('/:id/questions', idValidator, validate, async (req, res) => {
  try {
    const { id } = req.params;
    const questions = await pool.query(
      `SELECT q.*,
        json_agg(json_build_object('id', a.id, 'user_name', a.user_name, 'answer', a.answer, 'created_at', a.created_at))
        FILTER (WHERE a.id IS NOT NULL) as answers
       FROM questions q
       LEFT JOIN answers a ON a.question_id = q.id
       WHERE q.college_id = $1
       GROUP BY q.id
       ORDER BY q.created_at DESC`,
      [id]
    );
    res.json(questions.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4️⃣ Post a question (BEFORE /:id)
router.post('/:id/questions', [...idValidator, ...questionValidator], validate, async (req, res) => {
  try {
    const { id } = req.params;
    const { user_name, question } = req.body;
    const result = await pool.query(
      `INSERT INTO questions (college_id, user_name, question) VALUES ($1, $2, $3) RETURNING *`,
      [id, user_name, question]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5️⃣ Post an answer
router.post('/questions/:questionId/answers', answerValidator, validate, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { user_name, answer } = req.body;
    const result = await pool.query(
      `INSERT INTO answers (question_id, user_name, answer) VALUES ($1, $2, $3) RETURNING *`,
      [questionId, user_name, answer]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 6️⃣ GET single college by ID (ALWAYS LAST)
router.get('/:id', idValidator, validate, async (req, res) => {
  try {
    const { id } = req.params;
    const college = await pool.query(`SELECT * FROM colleges WHERE id = $1`, [id]);
    const courses = await pool.query(`SELECT * FROM courses WHERE college_id = $1`, [id]);
    const reviews = await pool.query(`SELECT * FROM reviews WHERE college_id = $1`, [id]);
    res.json({
      ...college.rows[0],
      courses: courses.rows,
      reviews: reviews.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;