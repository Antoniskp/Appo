const express = require('express');
const { body } = require('express-validator');
const {
  getAllPolls,
  getPollById,
  createPoll,
  votePoll,
  deletePoll
} = require('../controllers/pollsController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.get('/', getAllPolls);
router.get('/:id', getPollById);

// Protected routes
router.post(
  '/',
  authMiddleware,
  createLimiter,
  [
    body('question').notEmpty().withMessage('Question is required'),
    body('options').isArray({ min: 2 }).withMessage('Must provide at least 2 options'),
    validate
  ],
  createPoll
);

router.post(
  '/:id/vote',
  authMiddleware,
  [
    body('optionId').notEmpty().withMessage('Option ID is required'),
    validate
  ],
  votePoll
);

router.delete('/:id', authMiddleware, deletePoll);

module.exports = router;
