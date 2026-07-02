const { hasPermission } = require('../config/permissions');

const authorize = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ 
        success: false, 
        message: `Not authorized. Required permission: ${permission}` 
      });
    }

    next();
  };
};

module.exports = { authorize };