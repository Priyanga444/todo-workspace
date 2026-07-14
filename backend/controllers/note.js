const db = require('../db');
const fs = require('fs');
const path = require('path');

exports.getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      'SELECT * FROM notes WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, content } = req.body;

    let fileUrl = null;
    let fileName = null;

    if (req.file) {
      const { filename, originalname } = req.file;
      fileUrl = `/uploads/${filename}`;
      fileName = originalname;
    }

    const noteTitle = title || fileName || 'Untitled Note';

    const result = await db.query(
      'INSERT INTO notes (user_id, title, content, file_url, file_name) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, noteTitle, content || '', fileUrl, fileName]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content } = req.body;

    // Check ownership
    const checkResult = await db.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (checkResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    const result = await db.query(
      'UPDATE notes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [title || 'Untitled Note', content || '', id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check ownership
    const checkResult = await db.query('SELECT * FROM notes WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const note = checkResult.rows[0];
    if (note.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized action' });
    }

    // Unlink the imported PDF file if exists
    if (note.file_url) {
      const filename = note.file_url.replace('/uploads/', '');
      const filePath = path.join(__dirname, '../uploads/', filename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Failed to delete file from disk:', err);
      }
    }

    await db.query('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
