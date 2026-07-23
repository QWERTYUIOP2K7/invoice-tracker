const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  updateInvoiceStatus,
  uploadPDF,
  downloadPDF,
  viewPDF,
  uploadReceipt,
  deleteReceipt,
  deleteInvoice,
  getInvoiceHistory,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { uploadPDF: uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all invoices (scoped by role)
router.get('/', getInvoices);

// Create invoice
router.post('/', authorize('CREATE_INVOICE'), createInvoice);

// Get single invoice
router.get('/:id', getInvoice);

// Get invoice history
router.get('/:id/history', getInvoiceHistory);

// Update invoice details
router.put('/:id', authorize('UPDATE_INVOICE'), updateInvoice);

// Update invoice status
router.put('/:id/status', authorize('UPDATE_INVOICE_STATUS'), updateInvoiceStatus);

// Upload PDF to Cloudinary
router.post('/:id/upload-pdf', uploadMiddleware, uploadPDF);

// Download PDF
router.get('/:id/download-pdf', downloadPDF);

// View PDF (redirect)
router.get('/:id/view-pdf', viewPDF);

// Upload receipt to Cloudinary
router.post('/:id/upload-receipt', uploadMiddleware, uploadReceipt);

// Delete receipt
router.delete('/:id/receipt', deleteReceipt);

// Delete invoice (Draft only)
router.delete('/:id', authorize('UPDATE_INVOICE'), deleteInvoice);

router.post('/bulk-upload', protect, authorize('CREATE_INVOICE'), bulkUploadInvoices);

module.exports = router;