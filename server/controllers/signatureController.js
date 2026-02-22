const Signature = require('../models/Signature');
const Document = require('../models/Document');

// @desc    Add a signature placeholder
// @route   POST /api/signatures
// @access  Private
const createSignature = async (req, res) => {
    try {
        const { documentId, page, x, y } = req.body;

        const doc = await Document.findById(documentId);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check if user is owner or authorized signer (future)
        // For now, only owner can add signature placeholders
        if (doc.user.toString() !== req.user.id) {
            // Allow self-signing for now
            // return res.status(401).json({ message: 'Not authorized' });
        }

        const signature = await Signature.create({
            document: documentId,
            user: req.user.id,
            page,
            x,
            y,
            status: 'pending',
        });

        res.status(201).json(signature);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get signatures for a document
// @route   GET /api/signatures/:documentId
// @access  Private
const getSignatures = async (req, res) => {
    try {
        const signatures = await Signature.find({ document: req.params.documentId });
        res.json(signatures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all signatures for the user (for dashboard stats)
// @route   GET /api/signatures
// @access  Private
const getAllUserSignatures = async (req, res) => {
    try {
        const signatures = await Signature.find({ user: req.user.id });
        res.json(signatures);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update signature (sign or move)
// @route   PUT /api/signatures/:id
// @access  Private
const updateSignature = async (req, res) => {
    try {
        const { x, y, status, signatureText, signatureImage } = req.body;

        let signature = await Signature.findById(req.params.id);

        if (!signature) {
            return res.status(404).json({ message: 'Signature not found' });
        }

        if (signature.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Update fields if provided
        if (x !== undefined) signature.x = x;
        if (y !== undefined) signature.y = y;
        if (status) signature.status = status;
        if (signatureText) signature.signatureText = signatureText;
        if (signatureImage) signature.signatureImage = signatureImage;

        if (status === 'signed') {
            signature.signedAt = Date.now();
            signature.ipAddress = req.ip;
        }

        await signature.save();
        res.json(signature);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete signature
// @route   DELETE /api/signatures/:id
// @access  Private
const deleteSignature = async (req, res) => {
    try {
        const signature = await Signature.findById(req.params.id);

        if (!signature) {
            return res.status(404).json({ message: 'Signature not found' });
        }

        if (signature.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await signature.deleteOne();
        res.json({ message: 'Signature removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSignature,
    getSignatures,
    getAllUserSignatures,
    updateSignature,
    deleteSignature,
};
