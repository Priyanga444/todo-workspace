const db = require('../db');

const logActivity = async (userId, projectId, taskId, action, details) => {
  try {
    await db.query(
      'INSERT INTO activity_logs (user_id, project_id, task_id, action, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, projectId, taskId, action, details]
    );
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

module.exports = logActivity;
