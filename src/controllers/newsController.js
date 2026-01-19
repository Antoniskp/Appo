const pool = require('../config/database');

const getAllNews = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, title, content, author_id, created_at, updated_at FROM news ORDER BY created_at DESC'
    );
    res.json({ news: result.rows });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  } finally {
    client.release();
  }
};

const getNewsById = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const result = await client.query(
      'SELECT id, title, content, author_id, created_at, updated_at FROM news WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({ news: result.rows[0] });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  } finally {
    client.release();
  }
};

const createNews = async (req, res) => {
  const client = await pool.connect();
  try {
    const { title, content } = req.body;
    const authorId = req.userId;

    const result = await client.query(
      'INSERT INTO news (title, content, author_id) VALUES ($1, $2, $3) RETURNING id, title, content, author_id, created_at, updated_at',
      [title, content, authorId]
    );

    res.status(201).json({
      message: 'News created successfully',
      news: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: 'Failed to create news' });
  } finally {
    client.release();
  }
};

const updateNews = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const authorId = req.userId;

    // Check if news exists and belongs to user
    const existingNews = await client.query(
      'SELECT author_id FROM news WHERE id = $1',
      [id]
    );

    if (existingNews.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    if (existingNews.rows[0].author_id !== authorId) {
      return res.status(403).json({ error: 'Not authorized to update this news' });
    }

    const result = await client.query(
      'UPDATE news SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, title, content, author_id, created_at, updated_at',
      [title, content, id]
    );

    res.json({
      message: 'News updated successfully',
      news: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: 'Failed to update news' });
  } finally {
    client.release();
  }
};

const deleteNews = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const authorId = req.userId;

    // Check if news exists and belongs to user
    const existingNews = await client.query(
      'SELECT author_id FROM news WHERE id = $1',
      [id]
    );

    if (existingNews.rows.length === 0) {
      return res.status(404).json({ error: 'News not found' });
    }

    if (existingNews.rows[0].author_id !== authorId) {
      return res.status(403).json({ error: 'Not authorized to delete this news' });
    }

    await client.query('DELETE FROM news WHERE id = $1', [id]);

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllNews,
  getNewsById,
  createNews,
  updateNews,
  deleteNews
};
