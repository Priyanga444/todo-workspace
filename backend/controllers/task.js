const db = require('../db');
const logActivity = require('../utils/activityLogger');
const { sendNotification } = require('../utils/notifier');

exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await db.query(
      `SELECT t.*, 
              u.name as assignee_name, u.email as assignee_email, u.photo_url as assignee_photo,
              c.name as column_name,
              creator.name as creator_name
       FROM tasks t
       JOIN columns c ON t.column_id = c.id
       LEFT JOIN users u ON t.assignee_id = u.id
       LEFT JOIN users creator ON t.created_by = creator.id
       WHERE c.project_id = $1
       ORDER BY t.position ASC`,
      [projectId]
    );

    // Fetch labels for all these tasks
    const tasks = result.rows;
    for (let task of tasks) {
      const labelsResult = await db.query(
        `SELECT l.* FROM labels l
         JOIN task_labels tl ON l.id = tl.label_id
         WHERE tl.task_id = $1`,
        [task.id]
      );
      task.labels = labelsResult.rows;

      // Fetch checklist progress
      const checklistResult = await db.query(
        `SELECT ci.is_completed FROM checklist_items ci
         JOIN checklists c ON ci.checklist_id = c.id
         WHERE c.task_id = $1`,
        [task.id]
      );
      const items = checklistResult.rows;
      task.checklist_total = items.length;
      task.checklist_completed = items.filter(i => i.is_completed).length;
    }

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { column_id, title, description, priority, due_date, estimated_time, assignee_id } = req.body;
    const userId = req.user.id;

    if (!column_id || !title) {
      return res.status(400).json({ error: 'Column ID and Title are required' });
    }

    // Get project_id for activity logging and verify column exists
    const colResult = await db.query('SELECT project_id FROM columns WHERE id = $1', [column_id]);
    if (colResult.rows.length === 0) {
      return res.status(404).json({ error: 'Column not found' });
    }
    const projectId = colResult.rows[0].project_id;

    // Get position
    const posResult = await db.query(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE column_id = $1',
      [column_id]
    );
    const position = posResult.rows[0].max_pos + 1;

    const result = await db.query(
      `INSERT INTO tasks (column_id, title, description, priority, status, due_date, estimated_time, assignee_id, created_by, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [column_id, title, description, priority || 'Medium', 'active', due_date, estimated_time, assignee_id, userId, position]
    );
    const task = result.rows[0];

    // Log activity
    await logActivity(userId, projectId, task.id, 'CREATE_TASK', `Created task "${title}"`);

    // Create notification if assigned to someone else
    if (assignee_id && assignee_id !== userId) {
      await sendNotification(
        assignee_id, 
        'New Task Assigned', 
        `You have been assigned the task: "${title}"`
      );
    }

    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, due_date, estimated_time, actual_time, assignee_id, column_id } = req.body;
    const userId = req.user.id;

    // Fetch original task to check differences and get project_id
    const origResult = await db.query(
      `SELECT t.*, c.project_id FROM tasks t 
       JOIN columns c ON t.column_id = c.id 
       WHERE t.id = $1`,
      [id]
    );
    if (origResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const originalTask = origResult.rows[0];

    const result = await db.query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           priority = COALESCE($3, priority),
           status = COALESCE($4, status),
           due_date = $5,
           estimated_time = $6,
           actual_time = $7,
           assignee_id = $8,
           column_id = COALESCE($9, column_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [
        title,
        description,
        priority,
        status,
        due_date === '' || due_date === undefined ? null : due_date,
        estimated_time === '' || estimated_time === undefined ? null : estimated_time,
        actual_time === '' || actual_time === undefined ? null : actual_time,
        assignee_id === '' || assignee_id === undefined ? null : assignee_id,
        column_id,
        id
      ]
    );
    const updatedTask = result.rows[0];

    // Log Activity based on actions
    if (column_id && column_id !== originalTask.column_id) {
      await logActivity(userId, originalTask.project_id, id, 'MOVE_TASK', `Moved task "${updatedTask.title}" to another column`);
    } else {
      await logActivity(userId, originalTask.project_id, id, 'UPDATE_TASK', `Updated task "${updatedTask.title}"`);
    }

    // Send notifications if assignee changed
    if (assignee_id && assignee_id !== originalTask.assignee_id) {
      await sendNotification(
        assignee_id, 
        'Task Assigned', 
        `You have been assigned the task: "${updatedTask.title}"`
      );
    }

    res.json(updatedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const taskResult = await db.query(
      `SELECT t.*, c.project_id FROM tasks t 
       JOIN columns c ON t.column_id = c.id 
       WHERE t.id = $1`,
      [id]
    );
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const task = taskResult.rows[0];

    await db.query('DELETE FROM tasks WHERE id = $1', [id]);
    await logActivity(userId, task.project_id, id, 'DELETE_TASK', `Deleted task "${task.title}"`);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.reorderTasks = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { tasks } = req.body; // Array of { id, column_id, position }

    for (let t of tasks) {
      await client.query(
        'UPDATE tasks SET column_id = $1, position = $2 WHERE id = $3',
        [t.column_id, t.position, t.id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Tasks reordered successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

exports.duplicateTask = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const userId = req.user.id;

    // Get original task
    const taskResult = await client.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const orig = taskResult.rows[0];

    // Get next position in same column
    const posResult = await client.query(
      'SELECT COALESCE(MAX(position), -1) as max_pos FROM tasks WHERE column_id = $1',
      [orig.column_id]
    );
    const position = posResult.rows[0].max_pos + 1;

    // Create copy
    const copyResult = await client.query(
      `INSERT INTO tasks (column_id, title, description, priority, status, due_date, estimated_time, assignee_id, created_by, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [orig.column_id, `${orig.title} (Copy)`, orig.description, orig.priority, orig.status, orig.due_date, orig.estimated_time, orig.assignee_id, userId, position]
    );
    const newTask = copyResult.rows[0];

    // Copy labels
    await client.query(
      `INSERT INTO task_labels (task_id, label_id)
       SELECT $1, label_id FROM task_labels WHERE task_id = $2`,
      [newTask.id, id]
    );

    // Copy checklists
    const checklists = await client.query('SELECT * FROM checklists WHERE task_id = $1', [id]);
    for (let checklist of checklists.rows) {
      const newClResult = await client.query(
        'INSERT INTO checklists (task_id, title) VALUES ($1, $2) RETURNING id',
        [newTask.id, checklist.title]
      );
      const newClId = newClResult.rows[0].id;
      
      // Copy checklist items
      await client.query(
        `INSERT INTO checklist_items (checklist_id, content, is_completed, position)
         SELECT $1, content, is_completed, position FROM checklist_items WHERE checklist_id = $2`,
        [newClId, checklist.id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(newTask);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};
