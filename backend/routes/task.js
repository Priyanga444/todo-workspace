const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/project/:projectId', taskController.getTasksByProject);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.post('/reorder', taskController.reorderTasks);
router.post('/:id/duplicate', taskController.duplicateTask);

module.exports = router;
