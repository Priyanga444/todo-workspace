const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

const setupDatabase = async () => {
  try {
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Initializing database tables...');
    await pool.query(sql);
    console.log('Database initialization completed successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

module.exports = setupDatabase;
