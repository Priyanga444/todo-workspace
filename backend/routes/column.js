const express = require('express');
const router = express.Router();
const columnController = require('../controllers/column');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/project/:projectId', columnController.getColumnsByProject);
router.post('/', columnController.createColumn);
router.put('/:id', columnController.updateColumn);
router.delete('/:id', columnController.deleteColumn);
router.post('/reorder', columnController.reorderColumns);

module.exports = router;
