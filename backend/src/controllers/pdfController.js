const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const { recordHistory } = require('../services/historyService');
const { extractInvoiceData } = require('../services/pdfExtractionService');
const { ROLES } = require('../config/permissions');

// @route   POST /api/pdfs/:id/upload-pdf
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

// @route   POST /api/pdfs/extract-preview
// @access  Private/Finance/Admin
// @desc    Extract and preview invoice data from PDF (before creation)
exports.extractPDFPreview = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  try {
    // Read file buffer
    const pdfBuffer = fs.readFileSync(req.file.path);

    // Extract data from PDF
    const extractedData = await extractInvoiceData(pdfBuffer);

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: 'Data extracted successfully from PDF',
      extractedData,
      confidence: {
        invoiceNumber: extractedData.invoiceNumber ? 'high' : 'low',
        amount: extractedData.amount ? 'high' : 'low',
        clientName: extractedData.clientName ? 'medium' : 'low',
        dates: extractedData.invoiceDate && extractedData.dueDate ? 'medium' : 'low',
      },
    });
  } catch (err) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({
      success: false,
      message: 'Failed to extract data from PDF: ' + err.message,
    });
  }
});

// @route   GET /api/pdfs/:id/download-pdf
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

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'PDF file not found',
    });
  }

  res.download(filePath, `${invoice.invoiceNumber}.pdf`);
});

// @route   GET /api/pdfs/:id/view-pdf
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

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'PDF file not found',
    });
  }

  res.contentType('application/pdf');
  res.sendFile(filePath);
});