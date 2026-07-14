const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
  res.send('Task Manager API is running...');
});

const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/project');
const columnRoutes = require('./routes/column');
const taskRoutes = require('./routes/task');
const commentRoutes = require('./routes/comment');
const labelRoutes = require('./routes/label');
const checklistRoutes = require('./routes/checklist');
const attachmentRoutes = require('./routes/attachment');
const notificationRoutes = require('./routes/notification');
const analyticsRoutes = require('./routes/analytics');
const reminderRoutes = require('./routes/reminder');
const noteRoutes = require('./routes/note');

const setupDatabase = require('./db/setup');
const startReminderDaemon = require('./utils/reminderDaemon');

// Static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notes', noteRoutes);

// Setup Database and Start Server
setupDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startReminderDaemon();
  });
});
