import { body, query, validationResult } from 'express-validator';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Validation rules for different endpoints
export const bucketValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Bucket name must be between 1 and 50 characters')
      .matches(/^[a-zA-Z0-9\s-_]+$/)
      .withMessage('Bucket name can only contain letters, numbers, spaces, hyphens, and underscores'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color (e.g., #FF5733)'),
    validateRequest
  ],
  update: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Bucket name must be between 1 and 50 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters'),
    body('color')
      .optional()
      .matches(/^#[0-9A-Fa-f]{6}$/)
      .withMessage('Color must be a valid hex color'),
    validateRequest
  ]
};

export const searchValidation = {
  query: [
    body('query')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Search query must be between 1 and 500 characters')
      .notEmpty()
      .withMessage('Search query is required'),
    validateRequest
  ]
};

export const emailValidation = {
  updateBucket: [
    body('bucketId')
      .optional({ nullable: true })
      .isInt()
      .withMessage('Bucket ID must be a valid integer'),
    validateRequest
  ]
};
