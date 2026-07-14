const db = require('./db');

async function check() {
  try {
    const users = await db.query('SELECT id, name, email, workspace_mode FROM users');
    console.log('--- REGISTERED USERS ---');
    console.table(users.rows);

    const projects = await db.query('SELECT id, name, color FROM projects');
    console.log('--- PROJECTS ---');
    console.table(projects.rows);

    const members = await db.query('SELECT project_id, user_id, role FROM project_members');
    console.log('--- PROJECT MEMBERS ---');
    console.table(members.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
