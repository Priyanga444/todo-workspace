const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/members', projectController.addMember);

module.exports = router;
