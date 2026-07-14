const db = require('../db');
const logActivity = require('../utils/activityLogger');

exports.getCommentsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await db.query(
      `SELECT c.*, u.name as user_name, u.photo_url as user_photo
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { taskId, content } = req.body;
    const userId = req.user.id;

    if (!taskId || !content) {
      return res.status(400).json({ error: 'Task ID and content are required' });
    }

    const result = await db.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [taskId, userId, content]
    );
    const comment = result.rows[0];

    // Fetch comment with user info
    const fullComment = await db.query(
      `SELECT c.*, u.name as user_name, u.photo_url as user_photo
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [comment.id]
    );

    // Get project ID for activity log
    const taskResult = await db.query(
      'SELECT c.project_id, t.title FROM tasks t JOIN columns c ON t.column_id = c.id WHERE t.id = $1',
      [taskId]
    );
    if (taskResult.rows.length > 0) {
      const projId = taskResult.rows[0].project_id;
      const taskTitle = taskResult.rows[0].title;
      await logActivity(userId, projId, taskId, 'ADD_COMMENT', `Added a comment on task "${taskTitle}"`);
    }

    res.status(201).json(fullComment.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const result = await db.query(
      'UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [content, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING task_id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
