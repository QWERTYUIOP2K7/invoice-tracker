const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { recordHistory } = require('../services/historyService');
const { validateStatusTransition, validatePendingReason } = require('../services/invoiceWorkflow');
const { ROLES } = require('../config/permissions');

// @route   POST /api/invoices
// @access  Private/Finance/Admin
// @desc    Create a new invoice
exports.createInvoice = asyncHandler(async (req, res) => {
  const { clientId, invoiceNumber, invoiceMonth, amount, invoiceDate, dueDate, remarks } = req.body;

  // Validate input
  if (!clientId || !invoiceNumber || !invoiceMonth || !amount || !invoiceDate || !dueDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: clientId, invoiceNumber, invoiceMonth, amount, invoiceDate, dueDate',
    });
  }

  // Verify client exists
  const client = await Client.findById(clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found',
    });
  }

  // Check for duplicate invoice number
  const existingInvoice = await Invoice.findOne({ invoiceNumber });
  if (existingInvoice) {
    return res.status(400).json({
      success: false,
      message: 'Invoice number already exists',
    });
  }

  // Create invoice
  const invoice = await Invoice.create({
    clientId,
    invoiceNumber,
    invoiceMonth,
    amount,
    invoiceDate: new Date(invoiceDate),
    dueDate: new Date(dueDate),
    status: 'Draft',
    remarks,
    createdBy: req.user.id,
  });

  // Record creation in history
  await recordHistory(invoice._id, 'created', req.user.id);

  // Update client invoice count
  client.invoiceCount += 1;
  await client.save();

  res.status(201).json({
    success: true,
    message: 'Invoice created successfully',
    invoice,
  });
});

// @route   GET /api/invoices
// @access  Private
// @desc    Get invoices (scoped by client for non-admin users)
exports.getInvoices = asyncHandler(async (req, res) => {
  const { status, clientId, invoiceMonth, search } = req.query;

  // Build query
  let query = {};

  // For non-admin users, scope to their client
  if (req.user.role !== ROLES.ADMIN) {
    query.clientId = req.user.clientId;
  } else if (clientId) {
    // Admin can filter by specific client
    query.clientId = clientId;
  }

  if (status) {
    query.status = status;
  }

  if (invoiceMonth) {
    query.invoiceMonth = invoiceMonth;
  }

  if (search) {
    query.invoiceNumber = { $regex: search, $options: 'i' };
  }

  const invoices = await Invoice.find(query)
    .populate('clientId', 'companyName')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: invoices.length,
    invoices,
  });
});

// @route   GET /api/invoices/:id
// @access  Private
// @desc    Get single invoice
exports.getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('clientId', 'companyName contactEmail location')
    .populate('createdBy', 'name email');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Check authorization (non-admin users can only view their own client's invoices)
  if (req.user.role !== ROLES.ADMIN && invoice.clientId._id.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this invoice',
    });
  }

  res.status(200).json({
    success: true,
    invoice,
  });
});

// @route   PUT /api/invoices/:id
// @access  Private/Finance/Admin
// @desc    Update invoice details (not status)
exports.updateInvoice = asyncHandler(async (req, res) => {
  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Check authorization
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this invoice',
    });
  }

  const { invoiceMonth, amount, dueDate, remarks } = req.body;

  // Track changes in history
  if (invoiceMonth && invoiceMonth !== invoice.invoiceMonth) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'invoiceMonth', invoice.invoiceMonth, invoiceMonth);
    invoice.invoiceMonth = invoiceMonth;
  }

  if (amount && amount !== invoice.amount) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'amount', invoice.amount, amount);
    invoice.amount = amount;
  }

  if (dueDate && new Date(dueDate).getTime() !== invoice.dueDate.getTime()) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'dueDate', invoice.dueDate, new Date(dueDate));
    invoice.dueDate = new Date(dueDate);
  }

  if (remarks !== undefined && remarks !== invoice.remarks) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'remarks', invoice.remarks, remarks);
    invoice.remarks = remarks;
  }

  await invoice.save();

  res.status(200).json({
    success: true,
    message: 'Invoice updated successfully',
    invoice,
  });
});

// @route   PUT /api/invoices/:id/status
// @access  Private/Finance/Admin
// @desc    Update invoice status (with workflow validation)
exports.updateInvoiceStatus = asyncHandler(async (req, res) => {
  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Check authorization
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this invoice',
    });
  }

  const { status, pendingReason } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a status',
    });
  }

  // Validate status transition
  const transitionValidation = validateStatusTransition(invoice.status, status);
  if (!transitionValidation.valid) {
    return res.status(400).json({
      success: false,
      message: transitionValidation.message,
    });
  }

  // If transitioning to Pending, pendingReason is mandatory
  if (status === 'Pending') {
    if (!pendingReason) {
      return res.status(400).json({
        success: false,
        message: 'pendingReason is required when status is Pending',
      });
    }

    const reasonValidation = validatePendingReason(pendingReason);
    if (!reasonValidation.valid) {
      return res.status(400).json({
        success: false,
        message: reasonValidation.message,
      });
    }

    invoice.pendingReason = pendingReason;
  } else {
    // Clear pending reason if not pending
    invoice.pendingReason = null;
  }

  const oldStatus = invoice.status;
  invoice.status = status;
  await invoice.save();

  // Record status change in history
  await recordHistory(invoice._id, 'status_changed', req.user.id, 'status', oldStatus, status);

  res.status(200).json({
    success: true,
    message: 'Invoice status updated successfully',
    invoice,
  });
});

// @route   DELETE /api/invoices/:id
// @access  Private/Finance/Admin
// @desc    Delete invoice (only if Draft status)
exports.deleteInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Check authorization
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this invoice',
    });
  }

  // Only allow deletion of Draft invoices
  if (invoice.status !== 'Draft') {
    return res.status(400).json({
      success: false,
      message: 'Only Draft invoices can be deleted',
    });
  }

  await Invoice.findByIdAndDelete(req.params.id);

  // Update client invoice count
  const client = await Client.findById(invoice.clientId);
  if (client) {
    client.invoiceCount -= 1;
    await client.save();
  }

  res.status(200).json({
    success: true,
    message: 'Invoice deleted successfully',
  });
});

// @route   GET /api/invoices/:id/history
// @access  Private
// @desc    Get invoice history
exports.getInvoiceHistory = asyncHandler(async (req, res) => {
  const InvoiceHistory = require('../models/InvoiceHistory');

  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Check authorization
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this invoice history',
    });
  }

  const history = await InvoiceHistory.find({ invoiceId: req.params.id })
    .populate('changedBy', 'name email role')
    .sort({ timestamp: -1 });

  res.status(200).json({
    success: true,
    count: history.length,
    history,
  });
});