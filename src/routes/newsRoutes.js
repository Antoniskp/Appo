const express = require('express');
const { body } = require('express-validator');
const {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
} = require('../controllers/newsController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Public routes
router.get('/', getAllNews);
router.get('/:id', getNewsById);

// Protected routes
router.post(
  '/',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate
  ],
  createNews
);

router.put(
  '/:id',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate
  ],
  updateNews
);

router.delete('/:id', authMiddleware, deleteNews);

module.exports = router;
