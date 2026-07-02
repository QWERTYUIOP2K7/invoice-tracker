const { ROLES } = require('../config/permissions');

const scopeToClient = (req, res, next) => {
  // Admin can access everything
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  // For Finance and Client users, check they're accessing their own client
  if (!req.user.clientId) {
    return res.status(403).json({ 
      success: false, 
      message: 'User must be assigned to a client' 
    });
  }

  // Attach clientId to request for use in queries
  req.scopedClientId = req.user.clientId;
  next();
};

module.exports = { scopeToClient };