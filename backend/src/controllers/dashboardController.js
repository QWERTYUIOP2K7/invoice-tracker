const asyncHandler = require('express-async-handler');
const {
  getAdminKPIs,
  getAdminInvoiceStatusDistribution,
  getAdminRecentInvoiceActivity,
  getAdminTopClients,
  getAdminFinancePerformance,
  getFinanceKPIs,
  getFinanceMyClients,
  getFinanceMyWorkQueue,
  getClientKPIs,
  getClientInvoices,
} = require('../services/dashboardService');
const { ROLES } = require('../config/permissions');

// ==================== ADMIN DASHBOARD ====================

// @route   GET /api/dashboard/admin
// @access  Private/Admin
// @desc    Get admin dashboard KPIs
exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const kpis = await getAdminKPIs();

  res.status(200).json({
    success: true,
    data: kpis,
  });
});

// @route   GET /api/dashboard/admin/status-distribution
// @access  Private/Admin
// @desc    Get invoice status distribution
exports.getAdminStatusDistribution = asyncHandler(async (req, res) => {
  const distribution = await getAdminInvoiceStatusDistribution();

  res.status(200).json({
    success: true,
    data: distribution,
  });
});

// @route   GET /api/dashboard/admin/recent-activity
// @access  Private/Admin
// @desc    Get recent invoice activity
exports.getAdminRecentActivity = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const activity = await getAdminRecentInvoiceActivity(parseInt(limit, 10));

  res.status(200).json({
    success: true,
    count: activity.length,
    data: activity,
  });
});

// @route   GET /api/dashboard/admin/top-clients
// @access  Private/Admin
// @desc    Get top clients by outstanding amount
exports.getAdminTopClients = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;
  const topClients = await getAdminTopClients(parseInt(limit, 10));

  res.status(200).json({
    success: true,
    count: topClients.length,
    data: topClients,
  });
});

// @route   GET /api/dashboard/admin/finance-performance
// @access  Private/Admin
// @desc    Get finance team performance
exports.getAdminFinancePerformance = asyncHandler(async (req, res) => {
  const performance = await getAdminFinancePerformance();

  res.status(200).json({
    success: true,
    count: performance.length,
    data: performance,
  });
});

// ==================== FINANCE DASHBOARD ====================

// @route   GET /api/dashboard/finance
// @access  Private/Finance
// @desc    Get finance dashboard KPIs
exports.getFinanceDashboard = asyncHandler(async (req, res) => {
  const kpis = await getFinanceKPIs(req.user.id);

  if (!kpis) {
    return res.status(400).json({
      success: false,
      message: 'Finance user must be assigned to a client',
    });
  }

  res.status(200).json({
    success: true,
    data: kpis,
  });
});

// @route   GET /api/dashboard/finance/my-clients
// @access  Private/Finance
// @desc    Get assigned clients
exports.getFinanceMyClients = asyncHandler(async (req, res) => {
  const clients = await getFinanceMyClients(req.user.id);

  res.status(200).json({
    success: true,
    count: clients.length,
    data: clients,
  });
});

// @route   GET /api/dashboard/finance/work-queue
// @access  Private/Finance
// @desc    Get work queue(PI Status, pending, overdue)
exports.getFinanceWorkQueue = asyncHandler(async (req, res) => {
  const workQueue = await getFinanceMyWorkQueue(req.user.id);

  res.status(200).json({
    success: true,
    data: workQueue,
  });
});

// ==================== CLIENT DASHBOARD ====================

// @route   GET /api/dashboard/client
// @access  Private/Client
// @desc    Get client dashboard KPIs
exports.getClientDashboard = asyncHandler(async (req, res) => {
  const kpis = await getClientKPIs(req.user.clientId);

  res.status(200).json({
    success: true,
    data: kpis,
  });
});

// @route   GET /api/dashboard/client/invoices
// @access  Private/Client
// @desc    Get client invoices with pagination
exports.getClientInvoices = asyncHandler(async (req, res) => {
  const { skip = 0, limit = 10 } = req.query;
  const invoices = await getClientInvoices(
    req.user.clientId,
    parseInt(skip, 10),
    parseInt(limit, 10)
  );

  res.status(200).json({
    success: true,
    count: invoices.length,
    data: invoices,
  });
});