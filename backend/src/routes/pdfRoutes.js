const express = require('express');
const { uploadPDF, downloadPDF, viewPDF } = require('../controllers/pdfController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(protect);

// Upload PDF (Finance/Admin only)
router.post('/:id/upload-pdf', authorize('UPLOAD_PDF'), upload.single('file'), uploadPDF);

// Download PDF (all authenticated users, scoped by client)
router.get('/:id/download-pdf', downloadPDF);

// View PDF in browser (all authenticated users, scoped by client)
router.get('/:id/view-pdf', viewPDF);

module.exports = router;