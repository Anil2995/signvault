const express = require('express');
const router = express.Router();
const {
    createSignature,
    getSignatures,
    getAllUserSignatures,
    updateSignature,
    deleteSignature,
} = require('../controllers/signatureController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createSignature);
router.get('/', protect, getAllUserSignatures);
router.get('/:documentId', protect, getSignatures);
router.put('/:id', protect, updateSignature);
router.delete('/:id', protect, deleteSignature);

module.exports = router;
