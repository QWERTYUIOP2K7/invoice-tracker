const asyncHandler = require('express-async-handler');
const Remark = require('../models/Remark');
const Invoice = require('../models/Invoice');
const { ROLES } = require('../config/permissions');

// @route   POST /api/remarks/:invoiceId
// @access  Private (All roles)
// @desc    Add a remark to an invoice
exports.addRemark = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const { invoiceId } = req.params;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a message',
    });
  }

  // Verify invoice exists
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Client can only add remarks to their own invoices
  if (req.user.role === ROLES.CLIENT) {
    if (invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add remarks to this invoice',
      });
    }
  }

  // Finance can only add remarks to their assigned client's invoices
  if (req.user.role === ROLES.FINANCE) {
    if (invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add remarks to this invoice',
      });
    }
  }

  const remark = await Remark.create({
    invoiceId,
    clientId: invoice.clientId,
    message: message.trim(),
    addedBy: req.user.id,
    userRole: req.user.role,
  });

  const populatedRemark = await Remark.findById(remark._id)
    .populate('addedBy', 'name email role');

  res.status(201).json({
    success: true,
    message: 'Remark added successfully',
    remark: populatedRemark,
  });
});

// @route   GET /api/remarks/:invoiceId
// @access  Private (All roles)
// @desc    Get all remarks for an invoice
exports.getRemarks = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  // Verify invoice exists
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Client can only view remarks for their own invoices
  if (req.user.role === ROLES.CLIENT) {
    if (invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view remarks for this invoice',
      });
    }
  }

  // Finance can only view remarks for their assigned client's invoices
  if (req.user.role === ROLES.FINANCE) {
    if (invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view remarks for this invoice',
      });
    }
  }

  const remarks = await Remark.find({ invoiceId })
    .populate('addedBy', 'name email role')
    .sort({ createdAt: 1 }); // oldest first for chat style

  res.status(200).json({
    success: true,
    count: remarks.length,
    remarks,
  });
});