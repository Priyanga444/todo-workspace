const db = require('./db');
const { sendNotification } = require('./utils/notifier');

async function runTest() {
  try {
    console.log('Starting automated test run for Task Due Date Reminders...');

    // 1. Run migrations manually to ensure table has column (in case server has not restarted yet)
    console.log('Running database migrations...');
    await db.query('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_reminder_sent BOOLEAN DEFAULT false');

    // 2. Select a project and user to test with
    const userRes = await db.query('SELECT * FROM users LIMIT 1');
    const projectRes = await db.query('SELECT * FROM projects LIMIT 1');

    if (userRes.rows.length === 0 || projectRes.rows.length === 0) {
      console.log('No users or projects found. Please register/create one first.');
      process.exit();
    }

    const testUser = userRes.rows[0];
    const testProject = projectRes.rows[0];
    console.log(`Using Test User: "${testUser.name}" (${testUser.email})`);
    console.log(`Using Test Project: "${testProject.name}"`);

    // 3. Find or create a column for this project
    let colRes = await db.query('SELECT * FROM columns WHERE project_id = $1 LIMIT 1', [testProject.id]);
    let testColumn = colRes.rows[0];
    if (!testColumn) {
      const newCol = await db.query(
        'INSERT INTO columns (project_id, name, position) VALUES ($1, $2, 0) RETURNING *',
        [testProject.id, 'To Do']
      );
      testColumn = newCol.rows[0];
    }

    // 4. Create a mock task due in 2 hours
    const dueTime = new Date();
    dueTime.setHours(dueTime.getHours() + 2); // 2 hours from now

    console.log('Creating a mock task due in 2 hours...');
    const taskRes = await db.query(
      `INSERT INTO tasks (column_id, title, description, priority, status, due_date, assignee_id, created_by, position, due_reminder_sent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, false) RETURNING *`,
      [
        testColumn.id,
        'URGENT: Submit Design Drafts',
        'Review and publish final designs',
        'High',
        'active',
        dueTime,
        testUser.id,
        testUser.id
      ]
    );

    const testTask = taskRes.rows[0];
    console.log(`Created Task ID ${testTask.id} with due date: ${testTask.due_date}`);

    // 5. Run the daemon logic once to check if it finds the task
    console.log('Executing reminder daemon check logic...');
    const now = new Date();
    const taskResult = await db.query(
      `SELECT t.*, u.email, u.name as assignee_name, p.name as project_name 
       FROM tasks t
       JOIN users u ON t.assignee_id = u.id
       JOIN columns c ON t.column_id = c.id
       JOIN projects p ON c.project_id = p.id
       WHERE t.id = $1 
         AND t.due_date IS NOT NULL 
         AND t.due_date > $2 
         AND t.due_date <= $2 + INTERVAL '24 hours' 
         AND t.due_reminder_sent = false`,
      [testTask.id, now]
    );

    console.log(`Daemon query found ${taskResult.rows.length} matching tasks.`);

    if (taskResult.rows.length > 0) {
      const task = taskResult.rows[0];
      // Dispatch mock notification
      await sendNotification(
        task.assignee_id,
        'Upcoming Task Deadline (TEST)',
        `The task "${task.title}" in project "${task.project_name}" is due on ${new Date(task.due_date).toLocaleString()}. Please make sure to update its status or complete it soon.`
      );

      // Update in database
      await db.query('UPDATE tasks SET due_reminder_sent = true WHERE id = $1', [task.id]);
      console.log('SUCCESS: Task updated and set due_reminder_sent = true.');
    } else {
      console.log('FAILURE: Query did not detect task.');
    }

  } catch (err) {
    console.error('Error running test script:', err);
  } finally {
    process.exit();
  }
}

runTest();
