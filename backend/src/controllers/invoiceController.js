const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { recordHistory } = require('../services/historyService');
const { validateStatusTransition, validatePendingReason } = require('../services/invoiceWorkflow');
const { generateInvoiceNumber } = require('../services/invoiceNumberService');
const { ROLES } = require('../config/permissions');

// @route   POST /api/invoices
// @access  Private/Finance/Admin
// @desc    Create a new invoice
exports.createInvoice = asyncHandler(async (req, res) => {
  const { clientId, invoicePrefix, invoiceMonth, billingMonth, amount, invoiceDate, dueDate, poNumber, paymentTerms, deliveryNoteNumber, lineItems } = req.body;

  // Validate required fields
  if (!clientId || !invoicePrefix || !invoiceDate || !dueDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide required fields: clientId, invoicePrefix, invoiceDate, dueDate',
    });
  }

  // Either provide amount OR lineItems
  if (!amount && (!lineItems || lineItems.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide either amount or lineItems array',
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

  // Auto-generate invoice number
  const invoiceNumber = await generateInvoiceNumber(invoicePrefix, clientId);

  // Calculate total amount from lineItems if provided
  let totalAmount = amount;
  let processedLineItems = [];

  if (lineItems && lineItems.length > 0) {
    totalAmount = 0;
    processedLineItems = lineItems.map((item) => {
      const itemAmount = item.amount || item.quantity * item.ratePerUnit * (1 - (item.discountPercent || 0) / 100);
      totalAmount += itemAmount;
      return {
        description: item.description,
        hsnSacCode: item.hsnSacCode,
        quantity: item.quantity,
        ratePerUnit: item.ratePerUnit,
        discountPercent: item.discountPercent || 0,
        amount: itemAmount,
      };
    });
  }

  // Create invoice
  const invoice = await Invoice.create({
    invoiceNumber,
    invoicePrefix,
    clientId,
    invoiceMonth,
    billingMonth,
    amount: totalAmount,
    invoiceDate: new Date(invoiceDate),
    dueDate: new Date(dueDate),
    poNumber,
    paymentTerms,
    deliveryNoteNumber,
    lineItems: processedLineItems,
    status: 'Draft',
    createdBy: req.user.id,
  });

  // Record creation in history
  await recordHistory(invoice._id, 'created', req.user.id);

  // Update client invoice count
  client.invoiceCount += 1;
  client.outstandingAmount += totalAmount;
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
  const { status, clientId, invoiceMonth, billingMonth, search } = req.query;

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

  if (billingMonth) {
    query.billingMonth = billingMonth;
  }

  if (search) {
    query.invoiceNumber = { $regex: search, $options: 'i' };
  }

  const invoices = await Invoice.find(query)
    .populate('clientId', 'companyName gstin')
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
    .populate('clientId', 'companyName contactEmail contactPhone gstin address location')
    .populate('createdBy', 'name email')

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

  const { invoiceMonth, billingMonth, amount, dueDate, poNumber, paymentTerms, deliveryNoteNumber, lineItems } = req.body;

  // Track changes in history
  if (invoiceMonth && invoiceMonth !== invoice.invoiceMonth) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'invoiceMonth', invoice.invoiceMonth, invoiceMonth);
    invoice.invoiceMonth = invoiceMonth;
  }

  if (billingMonth && billingMonth !== invoice.billingMonth) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'billingMonth', invoice.billingMonth, billingMonth);
    invoice.billingMonth = billingMonth;
  }

  if (amount && amount !== invoice.amount) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'amount', invoice.amount, amount);
    invoice.amount = amount;
  }

  if (dueDate && new Date(dueDate).getTime() !== invoice.dueDate.getTime()) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'dueDate', invoice.dueDate, new Date(dueDate));
    invoice.dueDate = new Date(dueDate);
  }

  if (poNumber !== undefined && poNumber !== invoice.poNumber) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'poNumber', invoice.poNumber, poNumber);
    invoice.poNumber = poNumber;
  }

  if (paymentTerms !== undefined && paymentTerms !== invoice.paymentTerms) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'paymentTerms', invoice.paymentTerms, paymentTerms);
    invoice.paymentTerms = paymentTerms;
  }

  if (deliveryNoteNumber !== undefined && deliveryNoteNumber !== invoice.deliveryNoteNumber) {
    await recordHistory(invoice._id, 'updated', req.user.id, 'deliveryNoteNumber', invoice.deliveryNoteNumber, deliveryNoteNumber);
    invoice.deliveryNoteNumber = deliveryNoteNumber;
  }

  if (lineItems && lineItems.length > 0) {
    let totalAmount = 0;
    const processedLineItems = lineItems.map((item) => {
      const itemAmount = item.amount || item.quantity * item.ratePerUnit * (1 - (item.discountPercent || 0) / 100);
      totalAmount += itemAmount;
      return {
        description: item.description,
        hsnSacCode: item.hsnSacCode,
        quantity: item.quantity,
        ratePerUnit: item.ratePerUnit,
        discountPercent: item.discountPercent || 0,
        amount: itemAmount,
      };
    });
    await recordHistory(invoice._id, 'updated', req.user.id, 'lineItems', invoice.lineItems, processedLineItems);
    invoice.lineItems = processedLineItems;
    invoice.amount = totalAmount;
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

  // Update outstanding amount on client if status is Paid
  if (status === 'Paid') {
    const client = await Client.findById(invoice.clientId);
    if (client) {
      client.outstandingAmount = Math.max(0, client.outstandingAmount - invoice.amount);
      await client.save();
    }
  }

  await invoice.save();

  // Record status change in history
  await recordHistory(invoice._id, 'status_changed', req.user.id, 'status', oldStatus, status);

  res.status(200).json({
    success: true,
    message: 'Invoice status updated successfully',
    invoice,
  });
});

// @route   POST /api/invoices/:id/upload-pdf
// @access  Private/Finance/Admin
// @desc    Upload PDF to Cloudinary
exports.uploadPDF = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a PDF file',
    });
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Only finance and admin can upload
  if (req.user.role !== ROLES.FINANCE && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to upload PDF',
    });
  }

  // Check authorization - can only upload for own client
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to upload PDF for this invoice',
    });
  }

  // Save Cloudinary URL
  invoice.pdfUrl = req.file.path;
  await invoice.save();

  // Record in history
  await recordHistory(invoice._id, 'pdf_uploaded', req.user.id);

  res.status(200).json({
    success: true,
    message: 'PDF uploaded successfully',
    pdfUrl: req.file.path,
  });
});

// @route   GET /api/invoices/:id/download-pdf
// @access  Private
// @desc    Get PDF download URL
exports.downloadPDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice || !invoice.pdfUrl) {
    return res.status(404).json({
      success: false,
      message: 'PDF not found',
    });
  }

  // Check authorization
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to download this PDF',
    });
  }

  // Cloudinary URL is public - send it to frontend
  res.status(200).json({
    success: true,
    pdfUrl: invoice.pdfUrl,
  });
});

// @route   GET /api/invoices/:id/view-pdf
// @access  Private
// @desc    View PDF (redirect to Cloudinary)
exports.viewPDF = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice || !invoice.pdfUrl) {
    return res.status(404).json({
      success: false,
      message: 'PDF not found',
    });
  }

  // Check authorization
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this PDF',
    });
  }

  // Redirect to Cloudinary URL
  res.redirect(invoice.pdfUrl);
});

// @route   POST /api/invoices/:id/upload-receipt
// @access  Private
// @desc    Upload payment receipt to Cloudinary
exports.uploadReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a receipt file',
    });
  }

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Only allow receipt upload if invoice is Paid
  if (invoice.status !== 'Paid') {
    return res.status(400).json({
      success: false,
      message: 'Receipt can only be uploaded for Paid invoices',
    });
  }

  // Client can only upload receipt for their own invoices
  if (req.user.role === ROLES.CLIENT) {
    if (invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload receipt for this invoice',
      });
    }
  }

  // Finance can only upload receipt for their assigned client's invoices
  if (req.user.role === ROLES.FINANCE) {
    if (invoice.clientId.toString() !== req.user.clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload receipt for this invoice',
      });
    }
  }

  // Save Cloudinary URL
  invoice.receiptUrl = req.file.secure_url;
  invoice.receiptUploadedBy = req.user.id;
  invoice.receiptUploadedAt = new Date();

  await invoice.save();

  // Record in history
  await recordHistory(invoice._id, 'receipt_uploaded', req.user.id);

  res.status(200).json({
    success: true,
    message: 'Receipt uploaded successfully',
    invoice,
  });
});

// @route   DELETE /api/invoices/:id/receipt
// @access  Private/Finance/Admin
// @desc    Delete payment receipt
exports.deleteReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Only Admin and Finance can delete receipts
  if (req.user.role === ROLES.CLIENT) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete receipt',
    });
  }

  if (!invoice.receiptUrl) {
    return res.status(400).json({
      success: false,
      message: 'No receipt attached to this invoice',
    });
  }

  invoice.receiptUrl = null;
  invoice.receiptUploadedBy = null;
  invoice.receiptUploadedAt = null;

  await invoice.save();

  // Record in history
  await recordHistory(invoice._id, 'receipt_deleted', req.user.id);

  res.status(200).json({
    success: true,
    message: 'Receipt deleted successfully',
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

  // Update client invoice count and outstanding amount
  const client = await Client.findById(invoice.clientId);
  if (client) {
    client.invoiceCount = Math.max(0, client.invoiceCount - 1);
    client.outstandingAmount = Math.max(0, client.outstandingAmount - invoice.amount);
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