const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const { recordHistory } = require('../services/historyService');
const { ROLES } = require('../config/permissions');

// @route   POST /api/invoices/:id/upload-pdf
// @access  Private/Finance/Admin
// @desc    Upload invoice PDF
exports.uploadPDF = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) {
    // Delete uploaded file if invoice not found
    fs.unlinkSync(req.file.path);
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Check authorization
  if (req.user.role !== ROLES.ADMIN && invoice.clientId.toString() !== req.user.clientId.toString()) {
    fs.unlinkSync(req.file.path);
    return res.status(403).json({
      success: false,
      message: 'Not authorized to upload PDF for this invoice',
    });
  }

  // If there's an old PDF, delete it
  if (invoice.pdfUrl) {
    const oldFilePath = path.join(__dirname, '../../', invoice.pdfUrl);
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }
  }

  // Store relative path to PDF
  const pdfUrl = `uploads/${req.file.filename}`;
  const oldPdfUrl = invoice.pdfUrl;

  invoice.pdfUrl = pdfUrl;
  await invoice.save();

  // Record in history
  const action = oldPdfUrl ? 'pdf_replaced' : 'pdf_uploaded';
  await recordHistory(invoice._id, action, req.user.id, 'pdfUrl', oldPdfUrl, pdfUrl);

  res.status(200).json({
    success: true,
    message: 'PDF uploaded successfully',
    invoice,
  });
});

// @route   GET /api/invoices/:id/download-pdf
// @access  Private
// @desc    Download invoice PDF
exports.downloadPDF = asyncHandler(async (req, res) => {
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
      message: 'Not authorized to download this PDF',
    });
  }

  if (!invoice.pdfUrl) {
    return res.status(404).json({
      success: false,
      message: 'No PDF attached to this invoice',
    });
  }

  const filePath = path.join(__dirname, '../../', invoice.pdfUrl);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'PDF file not found',
    });
  }

  // Send file
  res.download(filePath, `${invoice.invoiceNumber}.pdf`);
});

// @route   GET /api/invoices/:id/view-pdf
// @access  Private
// @desc    View invoice PDF (stream in browser)
exports.viewPDF = asyncHandler(async (req, res) => {
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
      message: 'Not authorized to view this PDF',
    });
  }

  if (!invoice.pdfUrl) {
    return res.status(404).json({
      success: false,
      message: 'No PDF attached to this invoice',
    });
  }

  const filePath = path.join(__dirname, '../../', invoice.pdfUrl);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'PDF file not found',
    });
  }

  // Set content type and stream file
  res.contentType('application/pdf');
  res.sendFile(filePath);
});