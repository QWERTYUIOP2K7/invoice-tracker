const express = require('express');
const {
  getAdminDashboard,
  getAdminStatusDistribution,
  getAdminRecentActivity,
  getAdminTopClients,
  getAdminFinancePerformance,
  getFinanceDashboard,
  getFinanceMyClients,
  getFinanceWorkQueue,
  getClientDashboard,
  getClientInvoices,
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(protect);

// ==================== ADMIN ROUTES ====================
router.get(
  '/admin',
  authorize('VIEW_ADMIN_DASHBOARD'),
  getAdminDashboard
);
router.get(
  '/admin/status-distribution',
  authorize('VIEW_ADMIN_DASHBOARD'),
  getAdminStatusDistribution
);
router.get(
  '/admin/recent-activity',
  authorize('VIEW_ADMIN_DASHBOARD'),
  getAdminRecentActivity
);
router.get(
  '/admin/top-clients',
  authorize('VIEW_ADMIN_DASHBOARD'),
  getAdminTopClients
);
router.get(
  '/admin/finance-performance',
  authorize('VIEW_ADMIN_DASHBOARD'),
  getAdminFinancePerformance
);

// ==================== FINANCE ROUTES ====================
router.get(
  '/finance',
  authorize('VIEW_FINANCE_DASHBOARD'),
  getFinanceDashboard
);
router.get(
  '/finance/my-clients',
  authorize('VIEW_FINANCE_DASHBOARD'),
  getFinanceMyClients
);
router.get(
  '/finance/work-queue',
  authorize('VIEW_FINANCE_DASHBOARD'),
  getFinanceWorkQueue
);

// ==================== CLIENT ROUTES ====================
router.get(
  '/client',
  authorize('VIEW_CLIENT_DASHBOARD'),
  getClientDashboard
);
router.get(
  '/client/invoices',
  authorize('VIEW_CLIENT_DASHBOARD'),
  getClientInvoices
);

module.exports = router;