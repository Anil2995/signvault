const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema(
    {
        document: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Document',
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        status: {
            type: String,
            enum: ['pending', 'signed', 'rejected'],
            default: 'pending',
        },
        page: {
            type: Number,
            required: true,
        },
        x: {
            type: Number,
            required: true,
        },
        y: {
            type: Number,
            required: true,
        },
        signatureText: {
            type: String,
        },
        signatureImage: {
            type: String, // URL or base64
        },
        signedAt: {
            type: Date,
        },
        ipAddress: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Signature', signatureSchema);
