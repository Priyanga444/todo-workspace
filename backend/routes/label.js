const express = require('express');
const router = express.Router();
const labelController = require('../controllers/label');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/project/:projectId', labelController.getLabelsByProject);
router.post('/', labelController.createLabel);
router.post('/assign', labelController.assignLabelToTask);
router.post('/unassign', labelController.unassignLabelFromTask);
router.delete('/:id', labelController.deleteLabel);

module.exports = router;
