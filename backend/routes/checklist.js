const express = require('express');
const router = express.Router();
const checklistController = require('../controllers/checklist');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/task/:taskId', checklistController.getChecklistsByTask);
router.post('/', checklistController.createChecklist);
router.delete('/:id', checklistController.deleteChecklist);
router.post('/item', checklistController.createChecklistItem);
router.put('/item/:id', checklistController.toggleChecklistItem);
router.delete('/item/:id', checklistController.deleteChecklistItem);

module.exports = router;
