const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceHistory,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { scopeToClient } = require('../middleware/scopeToClient');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create invoice (Finance/Admin only)
router.post('/', authorize('CREATE_INVOICE'), createInvoice);

// Get invoices (all authenticated users, scoped by client if not admin)
router.get('/', scopeToClient, getInvoices);

// Export invoices to Excel
router.get('/export/excel', protect, async (req, res) => {
  try {
    console.log('Excel export started for user:', req.user.id);

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

// Get single invoice
router.get('/:id', scopeToClient, getInvoice);

// Get invoice history
router.get('/:id/history', scopeToClient, getInvoiceHistory);

// Update invoice details (Finance/Admin only)
router.put('/:id', authorize('UPDATE_INVOICE'), updateInvoice);

// Update invoice status (Finance/Admin only)
router.put('/:id/status', authorize('UPDATE_INVOICE_STATUS'), updateInvoiceStatus);

// Delete invoice (Finance/Admin only, Draft only)
router.delete('/:id', authorize('UPDATE_INVOICE'), deleteInvoice);



module.exports = router;