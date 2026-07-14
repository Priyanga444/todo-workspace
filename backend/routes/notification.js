const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
