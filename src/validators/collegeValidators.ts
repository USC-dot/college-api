const { body, query, param } = require('express-validator');

export const searchValidator = [
  query('search').optional().trim()
    .isLength({ max: 100 }).withMessage('Search term too long'),
  query('state').optional().trim()
    .isLength({ max: 50 }).withMessage('State name too long'),
  query('type').optional().trim()
    .isIn(['Government', 'Private', '']).withMessage('Type must be Government or Private'),
  query('fees_max').optional()
    .isNumeric().withMessage('Fees must be a number')
    .isInt({ min: 0 }).withMessage('Fees must be positive')
];

export const idValidator = [
  param('id').notEmpty().withMessage('ID is required')
    .isInt({ min: 1 }).withMessage('ID must be a valid number')
];

export const questionValidator = [
  body('user_name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('question').trim().notEmpty().withMessage('Question is required')
    .isLength({ min: 10, max: 500 }).withMessage('Question must be 10-500 characters')
];

export const answerValidator = [
  body('user_name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('answer').trim().notEmpty().withMessage('Answer is required')
    .isLength({ min: 5, max: 500 }).withMessage('Answer must be 5-500 characters')
];

export const predictorValidator = [
  query('exam').notEmpty().withMessage('Exam is required')
    .isIn(['JEE', 'BITSAT', 'MHT-CET', 'Other']).withMessage('Invalid exam type'),
  query('rank').notEmpty().withMessage('Rank is required')
    .isInt({ min: 1 }).withMessage('Rank must be a positive number')
];