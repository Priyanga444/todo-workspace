const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminder');
const authenticateToken = require('../middleware/auth');

// Protected routing for reminders console
router.post('/', authenticateToken, reminderController.createReminder);
router.get('/', authenticateToken, reminderController.getReminders);
router.delete('/:id', authenticateToken, reminderController.deleteReminder);

module.exports = router;
