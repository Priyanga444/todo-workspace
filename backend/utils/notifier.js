const db = require('../db');
const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;

  const isPlaceholder = 
    !process.env.SMTP_USER || 
    process.env.SMTP_USER === 'ethereal_user' ||
    (process.env.SMTP_USER.includes('gmail.com') && (!process.env.SMTP_PASS || process.env.SMTP_PASS === 'your_16_digit_app_password'));

  if (isPlaceholder) {
    console.log('[MAIL] SMTP credentials are placeholders. Creating dynamic Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`[MAIL] Dynamic Ethereal test account generated: ${testAccount.user}`);
    } catch (err) {
      console.error('[MAIL] Failed to create dynamic test account, falling back to default:', err);
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal_user',
          pass: 'ethereal_pass'
        }
      });
    }
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

/**
 * Creates a notification in the PostgreSQL database and sends an email alert to the user.
 * @param {number} userId - The user ID to notify
 * @param {string} title - The notification title
 * @param {string} message - The notification message content
 */
const sendNotification = async (userId, title, message, skipDbLog = false) => {
  try {
    if (!skipDbLog) {
      // 1. Insert notification record in the PostgreSQL database
      await db.query(
        'INSERT INTO notifications (user_id, title, message, is_read) VALUES ($1, $2, $3, false)',
        [userId, title, message]
      );
      console.log(`Database notification logged for User ID ${userId}: ${title}`);
    }

    // 2. Fetch the recipient user's email address
    const userRes = await db.query('SELECT email, name FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      console.warn(`User with ID ${userId} not found, skipping email notification.`);
      return;
    }
    const { email: userEmail, name: userName } = userRes.rows[0];

    // 3. Configure the email options
    const mailOptions = {
      from: '"Workspace Alerts" <noreply@workspace.com>',
      to: userEmail,
      subject: `[Workspace Alert] ${title}`,
      text: `Hello ${userName},\n\n${message}\n\nBest regards,\nYour Workspace Team`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #fbcfe8; border-radius: 24px; background-color: #fdf2f8; color: #701a75;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #d946ef, #8b5cf6); color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">W</div>
            <span style="font-weight: bold; font-size: 18px; color: #701a75;">Workspace Planner</span>
          </div>
          <h2 style="font-size: 20px; font-weight: bold; color: #701a75; margin-top: 0; margin-bottom: 8px;">Hello, ${userName}!</h2>
          <p style="font-size: 14px; color: #a21caf; margin-top: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${title}</p>
          <div style="padding: 16px; border-radius: 16px; background-color: #ffffff; border: 1.5px solid #fbcfe8; margin-bottom: 20px; box-shadow: 0 4px 10px rgba(217, 70, 239, 0.05);">
            <p style="font-size: 14px; margin: 0; line-height: 1.5; color: #701a75;">${message}</p>
          </div>
          <p style="font-size: 12px; color: #f472b6; line-height: 1.5;">This email was sent from an automated system. Please do not reply directly to this message.</p>
        </div>
      `
    };

    // 4. Send the email notification
    const activeTransporter = await getTransporter();
    activeTransporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error(`Failed to send email alert to ${userEmail}:`, err);
      } else {
        console.log(`Email alert sent successfully to ${userEmail}. MessageId: ${info.messageId}`);
        // If testing on Ethereal, print the link so they can preview it in terminal logs
        const testUrl = nodemailer.getTestMessageUrl(info);
        if (testUrl) {
          console.log(`Preview Email Alert at: ${testUrl}`);
        }
      }
    });

  } catch (err) {
    console.error('Error executing sendNotification:', err);
  }
};

module.exports = { sendNotification };
