const express = require('express');
const { uploadPDF, downloadPDF, viewPDF } = require('../controllers/pdfController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const upload = require('../middleware/upload');

const router = express.Router({ mergeParams: true });

router.use(protect);

// Upload PDF to existing invoice
router.post('/:id/upload-pdf', authorize('UPLOAD_PDF'), upload.single('file'), uploadPDF);

// Download PDF
router.get('/:id/download-pdf', downloadPDF);

// View PDF
router.get('/:id/view-pdf', viewPDF);

module.exports = router;