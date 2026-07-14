const bcrypt = require('bcrypt');
const db = require('../db');
const { sendNotification } = require('../utils/notifier');

const generateToken = (user) => {
  return user.id.toString();
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userCheck = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP code for registration verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, salt);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Ensure columns exist (in case migration didn't run)
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS otp_code TEXT,
      ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS workspace_mode VARCHAR(10) DEFAULT 'team';
    `);

    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, otp_code, otp_expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email, password_hash, otpHash, expiresAt]
    );
    const user = result.rows[0];

    // Print to server console for local testing preview
    console.log(`\n==============================================\n[SECURITY] REGISTER OTP FOR ${email} IS: ${otp}\n==============================================\n`);

    // Send email verification alert (skip database in-app log for security)
    await sendNotification(
      user.id,
      'Verify Your Workspace Account',
      `Your verification code is: ${otp}. This code will expire in 5 minutes.`,
      true
    );

    res.status(201).json({ requiresOtp: true, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Account not found.' });
    }

    const user = result.rows[0];

    // Validate password hash
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    delete user.password_hash;
    delete user.otp_code;
    delete user.otp_expires_at;

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification OTP are required' });
    }

    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const now = new Date();

    if (!user.otp_code || new Date(user.otp_expires_at) <= now) {
      return res.status(400).json({ error: 'Invalid or expired verification OTP' });
    }

    // Verify hashed OTP code
    const isValidOtp = await bcrypt.compare(otp, user.otp_code);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or expired verification OTP' });
    }

    // Clear verification codes on successful verify
    await db.query(
      'UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user);
    delete user.password_hash;
    delete user.otp_code;
    delete user.otp_expires_at;

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Account not found.' });
    }

    const user = result.rows[0];

    // Generate 6-digit OTP code for reset verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP using bcrypt
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

    // Save hash to database
    await db.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otpHash, expiresAt, user.id]
    );

    // Print to server console for local testing preview
    console.log(`\n==============================================\n[SECURITY] RESET PASSWORD OTP FOR ${email} IS: ${otp}\n==============================================\n`);

    // Send email alert notification
    await sendNotification(
      user.id,
      'Reset Your Workspace Password',
      `Your password reset code is: ${otp}. This code will expire in 10 minutes.`,
      true
    );

    res.json({ success: true, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Account not found.' });
    }

    const user = result.rows[0];
    const now = new Date();

    if (!user.otp_code || new Date(user.otp_expires_at) <= now) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Verify hashed OTP code
    const isValidOtp = await bcrypt.compare(otp, user.otp_code);
    if (!isValidOtp) {
      return res.status(400).json({ error: 'Invalid or expired reset code' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    // Update password and clear reset codes
    await db.query(
      'UPDATE users SET password_hash = $1, otp_code = NULL, otp_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [password_hash, user.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, bio, role, skills, phone, photo_url, workspace_mode FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, role, skills, phone, workspace_mode } = req.body;
    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), bio = COALESCE($2, bio), role = COALESCE($3, role), skills = COALESCE($4, skills), phone = COALESCE($5, phone), workspace_mode = COALESCE($6, workspace_mode), updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING id, name, email, bio, role, skills, phone, photo_url, workspace_mode',
      [name, bio, role, skills, phone, workspace_mode, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid current password' });

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [password_hash, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
