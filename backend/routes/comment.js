const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

router.get('/task/:taskId', commentController.getCommentsByTask);
router.post('/', commentController.createComment);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router;
