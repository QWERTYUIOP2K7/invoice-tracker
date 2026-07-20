const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
};

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
 // Check if finance user is pending approval
  if (user.status === 'pending_approval') {
    return res.status(401).json({
      success: false,
      message: 'Your registration is pending admin approval. Please wait for approval.',
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

// @route   POST /api/auth/register-client
// @access  Public
// @desc    Register a new client user
exports.registerClient = asyncHandler(async (req, res) => {
  const { name, email, password, clientCode } = req.body;

  // Validate input
  if (!name || !email || !password || !clientCode) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, email, password, clientCode',
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

  // Validate password length
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long',
    });
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Find client by code
  const client = await Client.findOne({ clientCode });
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Invalid client code. Please check your registration link.',
    });
  }

  // Create user
  user = await User.create({
    name,
    email,
    password,
    role: 'client',
    clientId: client._id,
    status: 'active',
  });

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
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
// @route   POST /api/auth/register-finance
// @access  Public
// @desc    Self-register as finance user (pending admin approval)
exports.registerFinance = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Validate input
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
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

  // Validate password
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  // Check passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  // Check if email already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Create finance user with pending_approval status
  user = await User.create({
    name: name.trim(),
    email: email.trim(),
    password,
    role: 'finance',
    status: 'pending_approval',
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Your account is pending admin approval.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});
// @route   GET /api/auth/me
// @access  Private
// @desc    Get current logged in user
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});