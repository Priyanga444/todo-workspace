const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const run = async () => {
  console.log('--- Database Configurator ---');
  const password = await askQuestion('Enter your PostgreSQL password: ');
  const dbUser = 'postgres';
  const dbHost = 'localhost';
  const dbPort = '5432';
  const dbName = 'task_manager_db';

  // 1. Connect to default postgres DB to create the target database
  const client = new Client({
    user: dbUser,
    host: dbHost,
    database: 'postgres',
    password: password,
    port: parseInt(dbPort),
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    // 2. Create the database
    console.log(`Checking if database "${dbName}" exists...`);
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (res.rows.length === 0) {
      console.log(`Creating database "${dbName}"...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err) {
    console.error('Failed to connect or create database:', err.message);
    rl.close();
    process.exit(1);
  } finally {
    await client.end();
  }

  // 3. Write .env file
  const envContent = `PORT=5000
JWT_SECRET=antigravity_secret_key
DB_USER=${dbUser}
DB_PASSWORD=${password}
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
`;

  const envPath = path.join(__dirname, '.env');
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('.env configuration file written successfully.');
  
  rl.close();
  console.log('\nSetup complete! You can now restart your backend server using "node index.js".');
};

run();
