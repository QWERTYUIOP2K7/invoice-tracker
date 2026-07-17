const asyncHandler = require('express-async-handler');
const Client = require('../models/Client');
const { generateClientCode } = require('../services/clientCodeService');
const { ROLES } = require('../config/permissions');

// @route   POST /api/clients
// @access  Private/Finance
// @desc    Create a new client
exports.createClient = asyncHandler(async (req, res) => {
  const { companyName, contactEmail, contactPhone, location, address, gstin, panNumber, stateCode } = req.body;

  // Validate required fields
  if (!companyName || !location) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide companyName and location' 
    });
  }

  // Generate unique client code
  const clientCode = await generateClientCode();

  // Create client
  const client = await Client.create({
    clientCode,
    companyName,
    contactEmail,
    contactPhone,
    location,
    address,
    gstin,
    panNumber,
    stateCode,
    status: 'active',
  });

  // Generate registration link
  const registrationLink = `${process.env.FRONTEND_URL}/register?clientCode=${client.clientCode}`;
  client.registrationLink = registrationLink;
  await client.save();

  res.status(201).json({
    success: true,
    message: 'Client created successfully',
    client,
  });
});

// @route   GET /api/clients
// @access  Private/Finance
// @desc    Get all clients
exports.getAllClients = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  // Build query
  let query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    // Search by company name or client code
    query.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { clientCode: { $regex: search, $options: 'i' } },
    ];
  }

  const clients = await Client.find(query).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: clients.length,
    clients,
  });
});

// @route   GET /api/clients/:id
// @access  Private/Finance
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
// @access  Private/Finance
// @desc    Update client
exports.updateClient = asyncHandler(async (req, res) => {
  let client = await Client.findById(req.params.id);

  if (!client) {
    return res.status(404).json({ 
      success: false, 
      message: 'Client not found' 
    });
  }

  const { companyName, contactEmail, contactPhone, location, address, gstin, panNumber, stateCode, status } = req.body;

  // Update fields (all optional)
  if (companyName) client.companyName = companyName;
  if (contactEmail) client.contactEmail = contactEmail;
  if (contactPhone) client.contactPhone = contactPhone;
  if (location) client.location = location;
  if (address) client.address = address;
  if (gstin) client.gstin = gstin;
  if (panNumber) client.panNumber = panNumber;
  if (stateCode) client.stateCode = stateCode;
  if (status) client.status = status;

  await client.save();

  res.status(200).json({
    success: true,
    message: 'Client updated successfully',
    client,
  });
});

// @route   DELETE /api/clients/:id
// @access  Private/Finance
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
// @access  Private/Finance
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