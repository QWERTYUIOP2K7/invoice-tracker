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
router.get('/export/excel', async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('clientId', 'clientCode companyName')
      .populate('createdBy', 'name')
      .lean();

    const { exportInvoicesToExcel } = require('../services/excelService');
    const workbook = await exportInvoicesToExcel(invoices);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Failed to export invoices',
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