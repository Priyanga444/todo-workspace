const db = require('../db');

/**
 * Creates a new scheduled reminder for the logged-in user.
 */
exports.createReminder = async (req, res) => {
  try {
    const { message, remind_at } = req.body;
    const userId = req.user.id;

    if (!message || !remind_at) {
      return res.status(400).json({ error: 'Message and scheduled date are required' });
    }

    // Ensure the table exists dynamically in case initialization is pending
    await db.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await db.query(
      'INSERT INTO reminders (user_id, message, remind_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, message, remind_at]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Fetches all scheduled reminders for the logged-in user.
 */
exports.getReminders = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ensure the table exists dynamically
    await db.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const result = await db.query(
      'SELECT * FROM reminders WHERE user_id = $1 ORDER BY remind_at ASC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Deletes a scheduled reminder.
 */
exports.deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await db.query('DELETE FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ message: 'Reminder deleted successfully' });
  } catch (err) {
    console.error('Error deleting reminder:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
