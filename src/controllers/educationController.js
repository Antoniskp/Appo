const pool = require('../config/database');

const getAllCourses = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, title, description, content, author_id, created_at, updated_at FROM courses ORDER BY created_at DESC'
    );
    res.json({ courses: result.rows });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  } finally {
    client.release();
  }
};

const getCourseById = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const result = await client.query(
      'SELECT id, title, description, content, author_id, created_at, updated_at FROM courses WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ course: result.rows[0] });
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  } finally {
    client.release();
  }
};

const createCourse = async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, description, content } = req.body;
    const authorId = req.userId;

    const result = await client.query(
      'INSERT INTO courses (title, description, content, author_id) VALUES ($1, $2, $3, $4) RETURNING id, title, description, content, author_id, created_at, updated_at',
      [title, description, content, authorId]
    );

    res.status(201).json({
      message: 'Course created successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  } finally {
    client.release();
  }
};

const updateCourse = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, description, content } = req.body;
    const authorId = req.userId;

    // Check if course exists and belongs to user
    const existingCourse = await client.query(
      'SELECT author_id FROM courses WHERE id = $1',
      [id]
    );

    if (existingCourse.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (existingCourse.rows[0].author_id !== authorId) {
      return res.status(403).json({ error: 'Not authorized to update this course' });
    }

    const result = await client.query(
      'UPDATE courses SET title = $1, description = $2, content = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, title, description, content, author_id, created_at, updated_at',
      [title, description, content, id]
    );

    res.json({
      message: 'Course updated successfully',
      course: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  } finally {
    client.release();
  }
};

const deleteCourse = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const authorId = req.userId;

    // Check if course exists and belongs to user
    const existingCourse = await client.query(
      'SELECT author_id FROM courses WHERE id = $1',
      [id]
    );

    if (existingCourse.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (existingCourse.rows[0].author_id !== authorId) {
      return res.status(403).json({ error: 'Not authorized to delete this course' });
    }

    await client.query('DELETE FROM courses WHERE id = $1', [id]);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
