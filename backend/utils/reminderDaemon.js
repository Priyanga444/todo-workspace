const db = require('../db');
const { sendNotification } = require('./notifier');

/**
 * Periodically polls the PostgreSQL reminders table to find pending tasks.
 * When scheduled time arrives, it triggers the email notifier and records a database log.
 */
const startReminderDaemon = () => {
  console.log('Starting scheduled reminders daemon...');
  
  setInterval(async () => {
    try {
      const now = new Date();
      
      // Fetch all pending reminders that are due
      const result = await db.query(
        'SELECT * FROM reminders WHERE remind_at <= $1 AND is_sent = false',
        [now]
      );

      const dueReminders = result.rows;
      if (dueReminders.length > 0) {
        console.log(`Daemon found ${dueReminders.length} scheduled reminders to process.`);
      }

      for (const reminder of dueReminders) {
        // 1. Trigger the email and database notification alerts
        await sendNotification(
          reminder.user_id,
          'Scheduled Reminder Triggered',
          reminder.message
        );

        // 2. Mark reminder as sent in database
        await db.query('UPDATE reminders SET is_sent = true WHERE id = $1', [reminder.id]);
        console.log(`Reminder ID ${reminder.id} sent successfully.`);
      }

      // Check approaching task due dates (due in next 24 hours, and not yet reminded)
      const taskResult = await db.query(
        `SELECT t.*, u.email, u.name as assignee_name, p.name as project_name 
         FROM tasks t
         JOIN users u ON t.assignee_id = u.id
         JOIN columns c ON t.column_id = c.id
         JOIN projects p ON c.project_id = p.id
         WHERE t.due_date IS NOT NULL 
           AND t.due_date > $1 
           AND t.due_date <= $1 + INTERVAL '24 hours' 
           AND t.due_reminder_sent = false`,
        [now]
      );

      const upcomingTasks = taskResult.rows;
      if (upcomingTasks.length > 0) {
        console.log(`Daemon found ${upcomingTasks.length} approaching tasks to remind.`);
      }

      for (const task of upcomingTasks) {
        // Send email and database notification alert
        await sendNotification(
          task.assignee_id,
          'Upcoming Task Deadline',
          `The task "${task.title}" in project "${task.project_name}" is due on ${new Date(task.due_date).toLocaleString()}. Please make sure to update its status or complete it soon.`
        );

        // Mark due reminder as sent
        await db.query('UPDATE tasks SET due_reminder_sent = true WHERE id = $1', [task.id]);
        console.log(`Due date reminder for Task ID ${task.id} sent successfully.`);
      }
    } catch (err) {
      console.error('Error running scheduled reminder daemon:', err);
    }
  }, 30000); // Check database records every 30 seconds
};

module.exports = startReminderDaemon;
