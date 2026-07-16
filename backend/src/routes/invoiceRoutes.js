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

// Export invoices to Excel
router.get('/export/excel', async (req, res) => {
  try {
    console.log('Excel export started for user:', req.user.id);

    const Invoice = require('../models/Invoice');
    const invoices = await Invoice.find()
      .populate('clientId', 'clientCode companyName')
      .populate('createdBy', 'name')
      .lean()
      .exec();

    console.log(`Found ${invoices.length} invoices to export`);

    const { exportInvoicesToExcel } = require('../services/excelService');
    const workbook = await exportInvoicesToExcel(invoices);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="invoices_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Excel export error:', err.message, err.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to export invoices: ' + err.message,
    });
  }
});

module.exports = router;