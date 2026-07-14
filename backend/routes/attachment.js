const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const attachmentController = require('../controllers/attachment');
const authenticateToken = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.use(authenticateToken);

router.get('/task/:taskId', attachmentController.getAttachmentsByTask);
router.post('/', upload.single('file'), attachmentController.createAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

module.exports = router;
