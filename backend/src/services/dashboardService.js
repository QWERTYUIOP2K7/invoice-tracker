const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Client = require('../models/Client');
const { ROLES } = require('../config/permissions');

// ==================== ADMIN DASHBOARD ====================

const getAdminKPIs = async () => {
  const [clientCount, invoiceStats, financeUserCount] = await Promise.all([
    Client.countDocuments({ status: 'active' }),
    Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalValue: { $sum: '$amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] },
          },
          pendingAmount: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Pending', 'Overdue']] },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ]),
    User.countDocuments({ role: ROLES.FINANCE, status: 'active' }),
  ]);

  const invoiceData = invoiceStats[0] || {
    totalInvoices: 0,
    totalValue: 0,
    paidAmount: 0,
    pendingAmount: 0,
  };

  return {
    totalClients: clientCount,
    totalFinanceUsers: financeUserCount,
    activeClients: clientCount,
    totalInvoices: invoiceData.totalInvoices,
    totalInvoiceValue: invoiceData.totalValue,
    paidAmount: invoiceData.paidAmount,
    outstandingAmount: invoiceData.totalValue - invoiceData.paidAmount,
    pendingAmount: invoiceData.pendingAmount,
  };
};

const getAdminInvoiceStatusDistribution = async () => {
  const distribution = await Invoice.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$amount' },
      },
    },
    { $sort: { count: -1 } },
  ]);

  return distribution;
};

const getAdminRecentInvoiceActivity = async (limit = 10) => {
  const activity = await Invoice.aggregate([
    { $sort: { updatedAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdByUser',
      },
    },
    {
      $project: {
        invoiceNumber: 1,
        status: 1,
        amount: 1,
        clientName: { $arrayElemAt: ['$client.companyName', 0] },
        updatedBy: { $arrayElemAt: ['$createdByUser.name', 0] },
        updatedAt: 1,
      },
    },
  ]);

  return activity;
};

const getAdminTopClients = async (limit = 5) => {
  const topClients = await Invoice.aggregate([
    {
      $group: {
        _id: '$clientId',
        outstandingAmount: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'Paid'] },
              '$amount',
              0,
            ],
          },
        },
        invoiceCount: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
    { $sort: { outstandingAmount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'clients',
        localField: '_id',
        foreignField: '_id',
        as: 'client',
      },
    },
    {
      $project: {
        clientName: { $arrayElemAt: ['$client.companyName', 0] },
        clientCode: { $arrayElemAt: ['$client.clientCode', 0] },
        outstandingAmount: 1,
        invoiceCount: 1,
        totalAmount: 1,
      },
    },
  ]);

  return topClients;
};

const getAdminFinancePerformance = async () => {
  const performance = await User.aggregate([
    { $match: { role: ROLES.FINANCE, status: 'active' } },
    {
      $lookup: {
        from: 'invoices',
        localField: '_id',
        foreignField: 'createdBy',
        as: 'invoices',
      },
    },
    {
      $lookup: {
        from: 'clients',
        localField: 'clientId',
        foreignField: '_id',
        as: 'client',
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        clientName: { $arrayElemAt: ['$client.companyName', 0] },
        totalInvoices: { $size: '$invoices' },
        pendingInvoices: {
          $size: {
            $filter: {
              input: '$invoices',
              as: 'invoice',
              cond: { $eq: ['$$invoice.status', 'Pending'] },
            },
          },
        },
        overdueInvoices: {
          $size: {
            $filter: {
              input: '$invoices',
              as: 'invoice',
              cond: { $eq: ['$$invoice.status', 'Overdue'] },
            },
          },
        },
      },
    },
    { $sort: { totalInvoices: -1 } },
  ]);

  return performance;
};

// ==================== FINANCE DASHBOARD ====================

const getFinanceKPIs = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.clientId) {
    return null;
  }

  const clientId = user.clientId;

  const [invoiceStats] = await Promise.all([
    Invoice.aggregate([
      { $match: { clientId } },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          paidInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] },
          },
          pendingInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
          },
          overdueInvoices: {
            $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] },
          },
          totalAmount: { $sum: '$amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] },
          },
        },
      },
    ]),
  ]);

  const stats = invoiceStats[0] || {
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
  };

  return {
    assignedClients: 1,
    totalInvoices: stats.totalInvoices,
    paidInvoices: stats.paidInvoices,
    pendingInvoices: stats.pendingInvoices,
    overdueInvoices: stats.overdueInvoices,
    outstandingAmount: stats.totalAmount - stats.paidAmount,
    paidThisMonth: 0, // Can be calculated if needed
  };
};

const getFinanceMyClients = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.clientId) {
    return [];
  }

  const clients = await Client.findById(user.clientId).lean();
  if (!clients) return [];

  const invoiceStats = await Invoice.aggregate([
    { $match: { clientId: user.clientId } },
    {
      $group: {
        _id: null,
        pendingInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
        },
        outstandingAmount: {
          $sum: {
            $cond: [
              { $ne: ['$status', 'Paid'] },
              '$amount',
              0,
            ],
          },
        },
        lastInvoiceDate: { $max: '$invoiceDate' },
      },
    },
  ]);

  const stats = invoiceStats[0] || {
    pendingInvoices: 0,
    outstandingAmount: 0,
    lastInvoiceDate: null,
  };

  return [
    {
      _id: clients._id,
      clientCode: clients.clientCode,
      companyName: clients.companyName,
      location: clients.location,
      outstandingAmount: stats.outstandingAmount,
      pendingInvoices: stats.pendingInvoices,
      lastInvoiceDate: stats.lastInvoiceDate,
    },
  ];
};

const getFinanceMyWorkQueue = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.clientId) {
    return { draft: [], pending: [], overdue: [] };
  }

  const clientId = user.clientId;

  const [drafts, pendings, overdues] = await Promise.all([
    Invoice.find({ clientId, status: 'Draft' })
      .select('invoiceNumber amount invoiceDate')
      .limit(10),
    Invoice.find({ clientId, status: 'Pending' })
      .select('invoiceNumber amount invoiceDate pendingReason')
      .limit(10),
    Invoice.find({ clientId, status: 'Overdue' })
      .select('invoiceNumber amount dueDate')
      .limit(10),
  ]);

  return {
    draft: drafts,
    pending: pendings,
    overdue: overdues,
  };
};

// ==================== CLIENT DASHBOARD ====================

const getClientKPIs = async (clientId) => {
  const invoiceStats = await Invoice.aggregate([
    { $match: { clientId } },
    {
      $group: {
        _id: null,
        totalInvoices: { $sum: 1 },
        paidInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, 1, 0] },
        },
        pendingInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
        },
        overdueInvoices: {
          $sum: { $cond: [{ $eq: ['$status', 'Overdue'] }, 1, 0] },
        },
        totalAmount: { $sum: '$amount' },
        paidAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$amount', 0] },
        },
      },
    },
  ]);

  const stats = invoiceStats[0] || {
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalAmount: 0,
    paidAmount: 0,
  };

  return {
    totalInvoices: stats.totalInvoices,
    paidInvoices: stats.paidInvoices,
    pendingInvoices: stats.pendingInvoices,
    overdueInvoices: stats.overdueInvoices,
    outstandingAmount: stats.totalAmount - stats.paidAmount,
  };
};

const getClientInvoices = async (clientId, skip = 0, limit = 10) => {
  const invoices = await Invoice.find({ clientId })
    .select('invoiceNumber billingMonth amount dueDate status pdfUrl remarks')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  return invoices;
};

module.exports = {
  // Admin
  getAdminKPIs,
  getAdminInvoiceStatusDistribution,
  getAdminRecentInvoiceActivity,
  getAdminTopClients,
  getAdminFinancePerformance,
  
  // Finance
  getFinanceKPIs,
  getFinanceMyClients,
  getFinanceMyWorkQueue,
  
  // Client
  getClientKPIs,
  getClientInvoices,
};