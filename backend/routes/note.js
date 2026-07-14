const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const noteController = require('../controllers/note');
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

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Restrict note uploads to PDF files (and text/image files if needed, but PDF is requested)
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.pdf' || ext === '.txt' || ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, text, or image files are allowed for notes import'), false);
    }
  }
});

router.use(authenticateToken);

router.get('/', noteController.getNotes);
router.post('/', upload.single('file'), noteController.createNote);
router.put('/:id', noteController.updateNote);
router.delete('/:id', noteController.deleteNote);

module.exports = router;
