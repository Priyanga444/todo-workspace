const db = require('../db');

exports.getChecklistsByTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await db.query(
      'SELECT * FROM checklists WHERE task_id = $1 ORDER BY id ASC',
      [taskId]
    );
    const checklists = result.rows;

    for (let cl of checklists) {
      const items = await db.query(
        'SELECT * FROM checklist_items WHERE checklist_id = $1 ORDER BY position ASC',
        [cl.id]
      );
      cl.items = items.rows;
    }

    res.json(checklists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createChecklist = async (req, res) => {
  try {
    const { taskId, title } = req.body;
    if (!taskId || !title) {
      return res.status(400).json({ error: 'Task ID and title are required' });
    }

    const result = await db.query(
      'INSERT INTO checklists (task_id, title) VALUES ($1, $2) RETURNING *',
      [taskId, title]
    );
    const checklist = result.rows[0];
    checklist.items = [];

    res.status(201).json(checklist);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteChecklist = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM checklists WHERE id = $1', [id]);
    res.json({ message: 'Checklist deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createChecklistItem = async (req, res) => {
  try {
    const { checklistId, content } = req.body;
    if (!checklistId || !content) {
      return res.status(400).json({ error: 'Checklist ID and content are required' });
    }

    // Get position
    const posResult = await db.query(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM checklist_items WHERE checklist_id = $1',
      [checklistId]
    );
    const position = posResult.rows[0].max_pos + 1;

    const result = await db.query(
      'INSERT INTO checklist_items (checklist_id, content, position) VALUES ($1, $2, $3) RETURNING *',
      [checklistId, content, position]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.toggleChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_completed } = req.body;

    const result = await db.query(
      'UPDATE checklist_items SET is_completed = $1 WHERE id = $2 RETURNING *',
      [is_completed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteChecklistItem = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM checklist_items WHERE id = $1', [id]);
    res.json({ message: 'Checklist item deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
