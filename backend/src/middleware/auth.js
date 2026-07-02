const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.user.status === 'inactive') {
      return res.status(401).json({ success: false, message: 'User account is inactive' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};

module.exports = { protect };