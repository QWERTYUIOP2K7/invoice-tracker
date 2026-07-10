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

  // SECURITY: Only allow registering as 'client' or 'finance' role
  // Admin users must be created by system admin only via separate endpoint
  if (role !== 'client' && role !== 'finance') {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid role. Contact system administrator to create admin accounts.' 
    });
  }

  // Finance users must have a clientId
  if (role === 'finance' && !clientId) {
    return res.status(400).json({
      success: false,
      message: 'Finance users must be assigned to a client',
    });
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({ success: false, message: 'Email already in use' });
  }

  // Verify client exists if clientId provided
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

  // Validate email & password
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  // Get user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if user is active
  if (user.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'Your account has been deactivated. Contact administrator.',
    });
  }

  // Check password
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
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