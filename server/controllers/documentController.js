const Document = require('../models/Document');
const Signature = require('../models/Signature');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
// fontkit can be used for custom fonts if needed
// const fontkit = require('@pdf-lib/fontkit');
const sendEmail = require('../utils/email');

// @desc    Upload a PDF document
// @route   POST /api/docs/upload
// @access  Private
const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { filename, originalname, path: filePath, mimetype, size } = req.file;

        const doc = await Document.create({
            user: req.user.id,
            filename, // Generated filename
            originalName: originalname, // Original filename
            path: filePath,
            mimeType: mimetype,
            size,
        });

        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all user documents
// @route   GET /api/docs
// @access  Private
const getDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ user: req.user.id }).sort({
            createdAt: -1,
        });
        res.json(docs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single document
// @route   GET /api/docs/:id
// @access  Private
const getDocumentById = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);

        if (doc) {
            // Check if user is owner
            if (doc.user.toString() !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized' });
            }
            res.json(doc);
        } else {
            res.status(404).json({ message: 'Document not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Finalize document (embed signatures)
// @route   POST /api/docs/:id/finalize
// @access  Private
const finalizeDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);

        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (doc.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const signatures = await Signature.find({
            document: req.params.id,
            status: 'signed',
        });

        if (signatures.length === 0) {
            return res.status(400).json({ message: 'No signatures to apply' });
        }

        // Read the existing PDF
        const pdfBytes = await fs.readFile(doc.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Embed standard font
        // For custom fonts we'd use fontkit
        // pdfDoc.registerFontkit(fontkit);
        const helveticaFont = await pdfDoc.embedFont('Helvetica');

        const pages = pdfDoc.getPages();

        for (const sig of signatures) {
            const pageIndex = sig.page - 1; // 1-based to 0-based
            if (pageIndex < 0 || pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            const { width, height } = page.getSize();

            // Convert position
            // sig.x, sig.y are percentages of the page container.
            // In frontend, they represent the CENTER of the signature element.
            // PDF coordinates: (0,0) is bottom-left.

            const x = (sig.x / 100) * width;
            const y = height - ((sig.y / 100) * height);

            if (sig.signatureImage) {
                // Embed PNG
                try {
                    const imageBytes = Buffer.from(sig.signatureImage.split(',')[1], 'base64');
                    const image = await pdfDoc.embedPng(imageBytes);

                    // Scale image reasonably (e.g. max width 150)
                    const imgDims = image.scale(0.5); // Start with scale
                    // Or fixed width
                    const targetWidth = 150;
                    const scaleFactor = targetWidth / image.width;
                    const scaledDims = image.scale(scaleFactor);

                    // Draw centered at x,y
                    page.drawImage(image, {
                        x: x - (scaledDims.width / 2),
                        y: y - (scaledDims.height / 2),
                        width: scaledDims.width,
                        height: scaledDims.height,
                    });
                } catch (err) {
                    console.error("Failed to embed image", err);
                }
            } else if (sig.signatureText) {
                const textSize = 24;
                const textWidth = helveticaFont.widthOfTextAtSize(sig.signatureText, textSize);
                const textHeight = helveticaFont.heightAtSize(textSize);

                page.drawText(sig.signatureText, {
                    x: x - (textWidth / 2),
                    y: y - (textHeight / 2), // Approx vertical center
                    size: textSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        // Save new PDF
        const pdfBytesSaved = await pdfDoc.save();
        const newFilename = `signed-${Date.now()}-${doc.originalName}`;
        const newPath = path.join('uploads', newFilename);

        await fs.writeFile(newPath, pdfBytesSaved);

        // Create a new Document record for the signed file
        // We'll calculate the new size
        const stats = await fs.stat(newPath);

        const signedDoc = await Document.create({
            user: req.user.id,
            filename: newFilename,
            originalName: `Signed - ${doc.originalName}`,
            path: newPath,
            mimeType: 'application/pdf',
            size: stats.size,
        });

        // Send Email with Attachment
        try {
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f6f8; }
                    .container { max-width: 600px; margin: 40px auto; padding: 0; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
                    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .icon-check { background-color: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; font-size: 30px; }
                    .content { padding: 40px 30px; }
                    .file-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; display: flex; align-items: center; gap: 15px; }
                    .file-icon { color: #ef4444; font-size: 24px; }
                    .file-name { font-weight: 600; color: #1e293b; }
                    .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="icon-check">✓</div>
                        <h1>Document Signed Successfully</h1>
                    </div>
                    <div class="content">
                        <p>Hello <strong>${req.user.name}</strong>,</p>
                        <p>Great news! Your document has been successfully processed and signed.</p>
                        
                        <div class="file-card">
                            <div class="file-icon">📄</div>
                            <div class="file-info">
                                <div class="file-name">${doc.originalName}</div>
                                <div style="font-size: 13px; color: #64748b;">Signed on ${new Date().toLocaleDateString()}</div>
                            </div>
                        </div>

                        <p>The signed version is attached to this email for your records.</p>
                        <p>You can also view and download it anytime from your <a href="${process.env.CLIENT_URL}/dashboard" style="color: #2563eb; text-decoration: none;">dashboard</a>.</p>
                    </div>
                    <div class="footer">
                        Powered by SignVault &bull; Secure Digital Signatures
                    </div>
                </div>
            </body>
            </html>
            `;

            await sendEmail({
                email: req.user.email,
                subject: `[Signed] ${doc.originalName}`,
                message: `Hello ${req.user.name},\n\nPlease find attached your signed document: ${doc.originalName}.\n\nThank you for using SignVault!`,
                html,
                attachments: [
                    {
                        filename: newFilename,
                        path: newPath, // local path
                        contentType: 'application/pdf',
                    },
                ],
            });
            console.log('Email sent successfully');
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Don't fail the request if email fails, just log it. 
            // Or maybe append a warning to the response message.
        }

        res.json({
            message: 'Document finalized and email sent (if applicable)',
            path: newPath.replace(/\\/g, '/'),
            filename: newFilename,
            document: signedDoc,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a document
// @route   DELETE /api/docs/:id
// @access  Private
const deleteDocument = async (req, res) => {
    try {
        const doc = await Document.findById(req.params.id);
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        if (doc.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Delete associated signatures
        await Signature.deleteMany({ document: doc._id });

        // Delete file from disk
        try {
            await fs.unlink(path.join(__dirname, '..', doc.path));
        } catch {
            // file may not exist
        }

        await doc.deleteOne();
        res.json({ message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocumentById,
    finalizeDocument,
    deleteDocument,
};
