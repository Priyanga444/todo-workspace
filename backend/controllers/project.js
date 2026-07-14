const db = require('../db');
const logActivity = require('../utils/activityLogger');

exports.createProject = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const { name, description, color } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const projectResult = await client.query(
      'INSERT INTO projects (name, description, color) VALUES ($1, $2, $3) RETURNING *',
      [name, description, color || '#6366f1']
    );
    const project = projectResult.rows[0];

    // Add creator as owner/member
    await client.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, userId, 'owner']
    );

    // Create default columns: Backlog, To Do, In Progress, Review, Testing, Completed
    const defaultColumns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Testing', 'Completed'];
    for (let i = 0; i < defaultColumns.length; i++) {
      await client.query(
        'INSERT INTO columns (project_id, name, position) VALUES ($1, $2, $3)',
        [project.id, defaultColumns[i], i]
      );
    }

    await client.query('COMMIT');
    await logActivity(userId, project.id, null, 'CREATE_PROJECT', `Created project "${name}"`);
    
    res.status(201).json(project);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

exports.getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(
      `SELECT p.*, pm.role 
       FROM projects p 
       JOIN project_members pm ON p.id = pm.project_id 
       WHERE pm.user_id = $1 AND p.status = 'active'`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check membership
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const projectResult = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projectResult.rows[0];

    // Fetch members
    const membersResult = await db.query(
      `SELECT u.id, u.name, u.email, u.photo_url, pm.role 
       FROM users u 
       JOIN project_members pm ON u.id = pm.user_id 
       WHERE pm.project_id = $1`,
      [id]
    );
    project.members = membersResult.rows;

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, status } = req.body;
    const userId = req.user.id;

    // Check permissions (only owner or member)
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `UPDATE projects 
       SET name = COALESCE($1, name), 
           description = COALESCE($2, description), 
           color = COALESCE($3, color), 
           status = COALESCE($4, status), 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
      [name, description, color, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await logActivity(userId, id, null, 'UPDATE_PROJECT', `Updated project properties`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check role (only owner can delete)
    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length === 0 || memberCheck.rows[0].role !== 'owner') {
      return res.status(403).json({ error: 'Only project owners can delete the project' });
    }

    await db.query('DELETE FROM projects WHERE id = $1', [id]);
    await logActivity(userId, id, null, 'DELETE_PROJECT', `Deleted project`);
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { id } = req.params; // project_id
    const { email, role } = req.body;
    const userId = req.user.id;

    const memberCheck = await db.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [id, userId]
    );
    if (memberCheck.rows.length === 0 || (memberCheck.rows[0].role !== 'owner' && memberCheck.rows[0].role !== 'admin')) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const userResult = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)',
      [email.trim()]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Make sure they have registered an account first.' });
    }
    const targetUserId = userResult.rows[0].id;

    await db.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role',
      [id, targetUserId, role || 'member']
    );

    res.json({ message: 'Member added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
