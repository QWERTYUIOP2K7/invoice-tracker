const ROLES = {
  ADMIN: 'admin',
  FINANCE: 'finance',
  CLIENT: 'client',
};

const PERMISSIONS = {
  // User management (Admin only)
  MANAGE_FINANCE_USERS: [ROLES.ADMIN],
  RESET_PASSWORD: [ROLES.ADMIN],
  
  // Client management
  MANAGE_CLIENTS: [ROLES.ADMIN, ROLES.FINANCE],
  
  // Invoice operations
  VIEW_ALL_INVOICES: [ROLES.ADMIN],
  CREATE_INVOICE: [ROLES.ADMIN, ROLES.FINANCE],
  UPDATE_INVOICE: [ROLES.ADMIN, ROLES.FINANCE],
  UPDATE_INVOICE_STATUS: [ROLES.ADMIN, ROLES.FINANCE],
  
  // PDF operations
  UPLOAD_PDF: [ROLES.ADMIN, ROLES.FINANCE],
  
  // General
  VIEW_INVOICE: [ROLES.ADMIN, ROLES.FINANCE, ROLES.CLIENT],
  ADD_REMARK: [ROLES.ADMIN, ROLES.FINANCE, ROLES.CLIENT],
  VIEW_HISTORY: [ROLES.ADMIN, ROLES.FINANCE, ROLES.CLIENT],
  
  // Dashboard access (NEW)
  VIEW_ADMIN_DASHBOARD: [ROLES.ADMIN],
  VIEW_FINANCE_DASHBOARD: [ROLES.FINANCE],
  VIEW_CLIENT_DASHBOARD: [ROLES.CLIENT],
};

const hasPermission = (role, permission) => {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
};

module.exports = { ROLES, PERMISSIONS, hasPermission };