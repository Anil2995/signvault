const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        passwordResetToken: String,
        passwordResetExpires: Date,
        defaultSignature: {
            type: { type: String, enum: ['text', 'image'] },
            value: String, // Text content or Base64 image
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('User', userSchema);
