const db = require('../db');

exports.getColumnsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db.query(
      'SELECT * FROM columns WHERE project_id = $1 ORDER BY position ASC',
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createColumn = async (req, res) => {
  try {
    const { projectId, name } = req.body;
    if (!projectId || !name) {
      return res.status(400).json({ error: 'Project ID and name are required' });
    }

    // Get current max position
    const posResult = await db.query(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM columns WHERE project_id = $1',
      [projectId]
    );
    const position = posResult.rows[0].max_pos + 1;

    const result = await db.query(
      'INSERT INTO columns (project_id, name, position) VALUES ($1, $2, $3) RETURNING *',
      [projectId, name, position]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateColumn = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const result = await db.query(
      'UPDATE columns SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteColumn = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM columns WHERE id = $1', [id]);
    res.json({ message: 'Column deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.reorderColumns = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { columns } = req.body; // Array of { id, position }

    for (let col of columns) {
      await client.query(
        'UPDATE columns SET position = $1 WHERE id = $2',
        [col.position, col.id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Columns reordered successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};
