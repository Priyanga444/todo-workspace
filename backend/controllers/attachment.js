const db = require('../db');

exports.getAttachmentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await db.query(
      'SELECT * FROM attachments WHERE task_id = $1 ORDER BY created_at DESC',
      [taskId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createAttachment = async (req, res) => {
  try {
    const { taskId } = req.body;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, filename } = req.file;
    const fileUrl = `/uploads/${filename}`; // Public URL

    const result = await db.query(
      'INSERT INTO attachments (task_id, user_id, file_name, file_url, file_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [taskId, userId, originalname, fileUrl, mimetype]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { id } = req.params;
    // Note: In production we'd also delete the file from disk/S3. For prototype this is fine.
    await db.query('DELETE FROM attachments WHERE id = $1', [id]);
    res.json({ message: 'Attachment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
