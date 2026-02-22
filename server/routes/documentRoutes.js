const express = require('express');
const router = express.Router();
const {
    uploadDocument,
    getDocuments,
    getDocumentById,
    finalizeDocument,
    deleteDocument,
} = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocumentById);
router.post('/:id/finalize', protect, finalizeDocument);
router.delete('/:id', protect, deleteDocument);

module.exports = router;
