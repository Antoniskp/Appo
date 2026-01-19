const express = require('express');
const { body } = require('express-validator');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/educationController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourseById);

// Protected routes
router.post(
  '/',
  authMiddleware,
  createLimiter,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate
  ],
  createCourse
);

router.put(
  '/:id',
  authMiddleware,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('content').notEmpty().withMessage('Content is required'),
    validate
  ],
  updateCourse
);

router.delete('/:id', authMiddleware, deleteCourse);

module.exports = router;
