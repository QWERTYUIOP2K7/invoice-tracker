const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/env');
const crypto = require('crypto');
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
// @route   POST /api/auth/register-admin
// @access  Public (first time only)
// @desc    Register first admin user
exports.registerAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword, adminSecret } = req.body;

  // Check if admin already exists
  const adminExists = await User.findOne({ role: 'admin' });
  if (adminExists && adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({
      success: false,
      message: 'Admin already exists. Invalid secret.',
    });
  }

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  user = await User.create({
    name: name.trim(),
    email: email.trim(),
    password,
    role: 'admin',
    status: 'active',
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Admin account created successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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
const crypto = require('crypto');

exports.registerFinance = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match',
    });
  }

  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Generate invite code (FIN001, FIN002, etc)
  const lastUser = await User.findOne({ role: 'finance' }).sort({ createdAt: -1 });
  const lastNumber = lastUser?.inviteCode ? parseInt(lastUser.inviteCode.replace('FIN', '')) : 0;
  const inviteCode = `FIN${String(lastNumber + 1).padStart(3, '0')}`;

  user = await User.create({
    name: name.trim(),
    email: email.trim(),
    password,
    role: 'finance',
    status: 'pending_approval',
    inviteCode,
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
      inviteCode: user.inviteCode,
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