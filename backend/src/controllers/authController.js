const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpiresIn });
};

// @route   POST /api/auth/register
// @access  Public (admin creates users, but this can be a helper)
// @desc    Register a new user
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, clientId } = req.body;

  // Validate input
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  // Validate clientId if not admin
  if (role !== 'admin' && !clientId) {
    return res.status(400).json({ success: false, message: 'clientId required for non-admin users' });
  }

  if (clientId) {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(400).json({ success: false, message: 'Client not found' });
    }
  }

  // Create user
  user = await User.create({
    name,
    email,
    password,
    role,
    clientId: clientId || null,
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    },
  });
});

// @route   POST /api/auth/login
// @access  Public
// @desc    Login user
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  // Check for user (password is not selected by default, so we must select it explicitly)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Check if user is active
  if (user.status === 'inactive') {
    return res.status(401).json({ success: false, message: 'User account is inactive' });
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  // Generate token
  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    },
  });
});

// @route   GET /api/auth/me
// @access  Private
// @desc    Get current user
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('clientId');

  res.status(200).json({
    success: true,
    user,
  });
});