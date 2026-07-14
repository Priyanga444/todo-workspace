const db = require('../db');

exports.getLabelsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db.query('SELECT * FROM labels WHERE project_id = $1', [projectId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createLabel = async (req, res) => {
  try {
    const { projectId, name, color } = req.body;
    if (!projectId || !name || !color) {
      return res.status(400).json({ error: 'Project ID, name, and color are required' });
    }

    const result = await db.query(
      'INSERT INTO labels (project_id, name, color) VALUES ($1, $2, $3) RETURNING *',
      [projectId, name, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.assignLabelToTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.body;
    if (!taskId || !labelId) {
      return res.status(400).json({ error: 'Task ID and Label ID are required' });
    }

    await db.query(
      'INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [taskId, labelId]
    );
    res.json({ message: 'Label assigned to task successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.unassignLabelFromTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.body;
    if (!taskId || !labelId) {
      return res.status(400).json({ error: 'Task ID and Label ID are required' });
    }

    await db.query(
      'DELETE FROM task_labels WHERE task_id = $1 AND label_id = $2',
      [taskId, labelId]
    );
    res.json({ message: 'Label unassigned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM labels WHERE id = $1', [id]);
    res.json({ message: 'Label deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
