const bcrypt = require('bcrypt');
const db = require('../db');

async function reset() {
  try {
    const hash = await bcrypt.hash('password123', 10);
    await db.query("UPDATE users SET password_hash = $1 WHERE email = 'priyangapriyanga444@gmail.com'", [hash]);
    console.log("UPDATE_SUCCESS");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
reset();
