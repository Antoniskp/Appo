const pool = require('../config/database');

const getAllPolls = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, question, author_id, created_at, updated_at FROM polls ORDER BY created_at DESC'
    );
    res.json({ polls: result.rows });
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  } finally {
    client.release();
  }
};

const getPollById = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    // Get poll details
    const pollResult = await client.query(
      'SELECT id, question, author_id, created_at, updated_at FROM polls WHERE id = $1',
      [id]
    );

    if (pollResult.rows.length === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Get poll options with vote counts
    const optionsResult = await client.query(
      'SELECT id, option_text, vote_count FROM poll_options WHERE poll_id = $1 ORDER BY id',
      [id]
    );

    res.json({
      poll: pollResult.rows[0],
      options: optionsResult.rows
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  } finally {
    client.release();
  }
};

const createPoll = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { question, options } = req.body;
    const authorId = req.userId;

    // Validate options
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Poll must have at least 2 options' });
    }

    // Create poll
    const pollResult = await client.query(
      'INSERT INTO polls (question, author_id) VALUES ($1, $2) RETURNING id, question, author_id, created_at, updated_at',
      [question, authorId]
    );

    const poll = pollResult.rows[0];

    // Create poll options
    const optionPromises = options.map(optionText =>
      client.query(
        'INSERT INTO poll_options (poll_id, option_text) VALUES ($1, $2) RETURNING id, option_text, vote_count',
        [poll.id, optionText]
      )
    );

    const optionResults = await Promise.all(optionPromises);
    const createdOptions = optionResults.map(result => result.rows[0]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Poll created successfully',
      poll,
      options: createdOptions
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  } finally {
    client.release();
  }
};

const votePoll = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { optionId } = req.body;
    const userId = req.userId;

    // Check if poll exists
    const pollExists = await client.query(
      'SELECT id FROM polls WHERE id = $1',
      [id]
    );

    if (pollExists.rows.length === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if user already voted
    const alreadyVoted = await client.query(
      'SELECT id FROM poll_votes WHERE poll_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (alreadyVoted.rows.length > 0) {
      return res.status(400).json({ error: 'You have already voted on this poll' });
    }

    // Check if option belongs to poll
    const optionExists = await client.query(
      'SELECT id FROM poll_options WHERE id = $1 AND poll_id = $2',
      [optionId, id]
    );

    if (optionExists.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid option for this poll' });
    }

    // Record vote
    await client.query(
      'INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES ($1, $2, $3)',
      [id, optionId, userId]
    );

    // Increment vote count
    await client.query(
      'UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = $1',
      [optionId]
    );

    await client.query('COMMIT');

    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  } finally {
    client.release();
  }
};

const deletePoll = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const authorId = req.userId;

    // Check if poll exists and belongs to user
    const existingPoll = await client.query(
      'SELECT author_id FROM polls WHERE id = $1',
      [id]
    );

    if (existingPoll.rows.length === 0) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (existingPoll.rows[0].author_id !== authorId) {
      return res.status(403).json({ error: 'Not authorized to delete this poll' });
    }

    // Delete votes, options, and poll (in order)
    await client.query('DELETE FROM poll_votes WHERE poll_id = $1', [id]);
    await client.query('DELETE FROM poll_options WHERE poll_id = $1', [id]);
    await client.query('DELETE FROM polls WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting poll:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  } finally {
    client.release();
  }
};

module.exports = {
  getAllPolls,
  getPollById,
  createPoll,
  votePoll,
  deletePoll
};
