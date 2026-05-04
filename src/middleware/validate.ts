import { Request, Response, NextFunction } from 'express';
const { validationResult } = require('express-validator');

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err: any) => ({
        field: err.path || err.param || 'unknown',
        message: err.msg
      }))
    });
    return;
  }
  next();
};