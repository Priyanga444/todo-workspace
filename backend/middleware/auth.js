const db = require('../db');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const userId = authHeader && authHeader.split(' ')[1];

  if (!userId) return res.sendStatus(401);

  const parsedId = parseInt(userId, 10);
  if (isNaN(parsedId)) {
    return res.sendStatus(401);
  }

  try {
    const result = await db.query('SELECT id, email FROM users WHERE id = $1', [parsedId]);
    if (result.rows.length === 0) return res.sendStatus(403);
    req.user = result.rows[0];
    next();
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};

module.exports = authenticateToken;
