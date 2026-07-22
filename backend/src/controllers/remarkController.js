const asyncHandler = require('express-async-handler');
const Remark = require('../models/Remark');
const Invoice = require('../models/Invoice');
const { ROLES } = require('../config/permissions');

// @route   GET /api/remarks/:invoiceId
// @access  Private
// @desc    Get remarks for an invoice
exports.getRemarks = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  if (req.user.role !== 'admin') {
    if (req.user.role === 'finance' && invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these remarks',
      });
    }
    if (req.user.role === 'client' && invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these remarks',
      });
    }
  }

  const remarks = await Remark.find({ invoiceId })
    .populate('addedBy', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: remarks.length,
    remarks,
  });
});

// @route   POST /api/remarks/:invoiceId
// @access  Private
// @desc    Add remark to an invoice
exports.addRemark = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message is required',
    });
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  if (req.user.role !== 'admin') {
    if (req.user.role === 'finance' && invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add remarks',
      });
    }
    if (req.user.role === 'client' && invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add remarks',
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

  await remark.populate('addedBy', 'name email role');

  res.status(201).json({
    success: true,
    message: 'Remark added successfully',
    remark,
  });
});