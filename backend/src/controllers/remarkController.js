const asyncHandler = require('express-async-handler');
const Remark = require('../models/Remark');
const Invoice = require('../models/Invoice');
const { ROLES } = require('../config/permissions');
exports.getRemarks = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
    // Admin can view any invoice's remarks
    // Finance/Client can only view their own
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
  };

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

    // Admin can add to any invoice
    // Finance/Client can only add to their own
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
  })

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

module.exports = {
  getRemarks,
  addRemark,
};