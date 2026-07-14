const db = require('../db');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch projects count user is member of
    const projectsCountResult = await db.query(
      'SELECT COUNT(*) FROM project_members WHERE user_id = $1',
      [userId]
    );
    const totalProjects = parseInt(projectsCountResult.rows[0].count);

    // Fetch tasks counts related to user's projects
    const tasksStatsResult = await db.query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN t.status = 'Completed' OR col.name = 'Completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN col.name = 'In Progress' THEN 1 END) as in_progress_tasks,
        COUNT(CASE WHEN col.name = 'To Do' OR col.name = 'Backlog' THEN 1 END) as pending_tasks,
        COUNT(CASE WHEN t.due_date < NOW() AND col.name != 'Completed' THEN 1 END) as overdue_tasks
       FROM tasks t
       JOIN columns col ON t.column_id = col.id
       JOIN project_members pm ON col.project_id = pm.project_id
       WHERE pm.user_id = $1`,
      [userId]
    );
    
    const stats = tasksStatsResult.rows[0];
    const totalTasks = parseInt(stats.total_tasks) || 0;
    const completedTasks = parseInt(stats.completed_tasks) || 0;
    const inProgressTasks = parseInt(stats.in_progress_tasks) || 0;
    const pendingTasks = parseInt(stats.pending_tasks) || 0;
    const overdueTasks = parseInt(stats.overdue_tasks) || 0;

    const productivityPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      overdueTasks,
      productivityPercentage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAnalyticsCharts = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Tasks by Priority
    const priorityResult = await db.query(
      `SELECT t.priority, COUNT(*) as count
       FROM tasks t
       JOIN columns col ON t.column_id = col.id
       JOIN project_members pm ON col.project_id = pm.project_id
       WHERE pm.user_id = $1
       GROUP BY t.priority`,
      [userId]
    );

    // 2. Tasks by Status (using columns names as status)
    const statusResult = await db.query(
      `SELECT col.name as status, COUNT(*) as count
       FROM tasks t
       JOIN columns col ON t.column_id = col.id
       JOIN project_members pm ON col.project_id = pm.project_id
       WHERE pm.user_id = $1
       GROUP BY col.name`,
      [userId]
    );

    // 3. Project Progress (percentage of completed tasks per project)
    const projectProgressResult = await db.query(
      `SELECT p.id, p.name, 
              COUNT(t.id) as total_tasks,
              COUNT(CASE WHEN col.name = 'Completed' THEN 1 END) as completed_tasks
       FROM projects p
       JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN columns col ON p.id = col.project_id
       LEFT JOIN tasks t ON col.id = t.column_id
       WHERE pm.user_id = $1
       GROUP BY p.id, p.name`,
      [userId]
    );

    const projectProgress = projectProgressResult.rows.map(row => {
      const total = parseInt(row.total_tasks) || 0;
      const completed = parseInt(row.completed_tasks) || 0;
      return {
        id: row.id,
        name: row.name,
        progress: total > 0 ? Math.round((completed / total) * 100) : 0
      };
    });

    // 4. Tasks completed daily (past 7 days)
    const dailyResult = await db.query(
      `SELECT TO_CHAR(t.updated_at, 'YYYY-MM-DD') as date, COUNT(*) as count
       FROM tasks t
       JOIN columns col ON t.column_id = col.id
       JOIN project_members pm ON col.project_id = pm.project_id
       WHERE pm.user_id = $1 AND col.name = 'Completed' AND t.updated_at >= NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(t.updated_at, 'YYYY-MM-DD')
       ORDER BY date ASC`,
      [userId]
    );

    // 5. Activity Log (last 15 activities user can see based on projects membership)
    const activityResult = await db.query(
      `SELECT al.*, u.name as user_name, u.photo_url as user_photo, p.name as project_name, t.title as task_title
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       LEFT JOIN projects p ON al.project_id = p.id
       LEFT JOIN tasks t ON al.task_id = t.id
       JOIN project_members pm ON al.project_id = pm.project_id
       WHERE pm.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT 15`,
      [userId]
    );

    res.json({
      priorityData: priorityResult.rows,
      statusData: statusResult.rows,
      projectProgress,
      dailyData: dailyResult.rows,
      recentActivity: activityResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
