const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const { ROLES } = require('../config/permissions');

// @route   POST /api/clients
// @access  Private/Admin
// @desc    Create a new client
exports.createClient = asyncHandler(async (req, res) => {
  const { companyName, contactEmail, location } = req.body;

  // Validate input
  if (!companyName || !contactEmail || !location) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide companyName, contactEmail, and location' 
    });
  }

  // Check if client already exists
  const existingClient = await Client.findOne({ companyName });
  if (existingClient) {
    return res.status(400).json({ 
      success: false, 
      message: 'A client with this company name already exists' 
    });
  }

  // Create client
  const client = await Client.create({
    companyName,
    contactEmail,
    location,
    status: 'active',
  });

  res.status(201).json({
    success: true,
    message: 'Client created successfully',
    client,
  });
});

// @route   GET /api/clients
// @access  Private/Admin
// @desc    Get all clients (Admin only)
exports.getAllClients = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  // Build query
  let query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.companyName = { $regex: search, $options: 'i' };
  }

  const clients = await Client.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: clients.length,
    clients,
  });
});

// @route   GET /api/clients/:id
// @access  Private/Admin
// @desc    Get single client by ID
exports.getClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({ 
      success: false, 
      message: 'Client not found' 
    });
  }

  res.status(200).json({
    success: true,
    client,
  });
});

// @route   PUT /api/clients/:id
// @access  Private/Admin
// @desc    Update client
exports.updateClient = asyncHandler(async (req, res) => {
  let client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({ 
      success: false, 
      message: 'Client not found' 
    });
  }

  const { companyName, contactEmail, location, status } = req.body;

  // Check for duplicate company name (if being updated)
  if (companyName && companyName !== client.companyName) {
    const existingClient = await Client.findOne({ companyName });
    if (existingClient) {
      return res.status(400).json({ 
        success: false, 
        message: 'A client with this company name already exists' 
      });
    }
  }

  // Update fields
  if (companyName) client.companyName = companyName;
  if (contactEmail) client.contactEmail = contactEmail;
  if (location) client.location = location;
  if (status) client.status = status;

  await client.save();

  res.status(200).json({
    success: true,
    message: 'Client updated successfully',
    client,
  });
});

// @route   DELETE /api/clients/:id
// @access  Private/Admin
// @desc    Deactivate client (soft delete)
exports.deleteClient = asyncHandler(async (req, res) => {
  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({ 
      success: false, 
      message: 'Client not found' 
    });
  }

  // Mark as inactive instead of deleting
  client.status = 'inactive';
  await client.save();

  res.status(200).json({
    success: true,
    message: 'Client deactivated successfully',
    client,
  });
});

// @route   GET /api/clients/:id/stats
// @access  Private/Admin
// @desc    Get client statistics (invoice count, outstanding amount)
exports.getClientStats = asyncHandler(async (req, res) => {
  const Invoice = require('../models/Invoice');

  const client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({ 
      success: false, 
      message: 'Client not found' 
    });
  }

  // Calculate stats
  const invoices = await Invoice.find({ clientId: req.params.id });
  const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
  const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
  const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');

  const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const outstandingAmount = totalAmount - paidAmount;

  res.status(200).json({
    success: true,
    stats: {
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      overdueInvoices: overdueInvoices.length,
      totalAmount,
      paidAmount,
      outstandingAmount,
    },
  });
});