import { body, validationResult } from 'express-validator';

export const validateRegister = [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//   body('publicKey').notEmpty().withMessage('Public key is required for end-to-end encryption')
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const validateMessage = [
  body('receiverId').notEmpty().withMessage('Receiver ID is required'),
  body('ciphertext').notEmpty().withMessage('Ciphertext is required'),
  body('iv').notEmpty().withMessage('Initialization vector (IV) is required')
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};