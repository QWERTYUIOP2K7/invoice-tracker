const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/permissions');

// @route   POST /api/users
// @access  Private/Admin
// @desc    Create a new finance user
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, clientId } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, password, and role',
    });
  }

  // Only allow admin to create finance users
  if (role !== ROLES.FINANCE) {
    return res.status(400).json({
      success: false,
      message: 'Only finance users can be created via this endpoint',
    });
  }

  // Finance users must have a clientId
  if (!clientId) {
    return res.status(400).json({
      success: false,
      message: 'Finance users must be assigned to a client',
    });
  }

  // Verify client exists
  const client = await Client.findById(clientId);
  if (!client) {
    return res.status(404).json({
      success: false,
      message: 'Client not found',
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already in use',
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: ROLES.FINANCE,
    clientId,
    status: 'active',
  });

  res.status(201).json({
    success: true,
    message: 'Finance user created successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      status: user.status,
    },
  });
});

// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all finance users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { status, clientId, search } = req.query;

  let query = { role: ROLES.FINANCE }; // Only fetch finance users

  if (status) {
    query.status = status;
  }

  if (clientId) {
    query.clientId = clientId;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .populate('clientId', 'clientCode companyName location')
    .select('-password')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

// @route   GET /api/users/:id
// @access  Private/Admin
// @desc    Get single user by ID
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('clientId', 'clientCode companyName location')
    .select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Only allow fetching finance users
  if (user.role !== ROLES.FINANCE) {
    return res.status(403).json({
      success: false,
      message: 'Can only view finance users',
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// @route   PUT /api/users/:id
// @access  Private/Admin
// @desc    Update finance user
exports.updateUser = asyncHandler(async (req, res) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Only allow updating finance users
  if (user.role !== ROLES.FINANCE) {
    return res.status(403).json({
      success: false,
      message: 'Can only update finance users',
    });
  }

  const { name, email, clientId, status } = req.body;

  // Check if email is being changed and if it already exists
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }
  }

  // Verify new clientId exists if being changed
  if (clientId && clientId !== user.clientId.toString()) {
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found',
      });
    }
  }

  // Update fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (clientId) user.clientId = clientId;
  if (status) user.status = status;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
      status: user.status,
    },
  });
});

// @route   DELETE /api/users/:id
// @access  Private/Admin
// @desc    Delete/Deactivate finance user
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Only allow deleting finance users
  if (user.role !== ROLES.FINANCE) {
    return res.status(403).json({
      success: false,
      message: 'Can only delete finance users',
    });
  }

  // Soft delete - mark as inactive
  user.status = 'inactive';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  });
});

// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
// @desc    Reset finance user password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a new password',
    });
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Only allow resetting password for finance users
  if (user.role !== ROLES.FINANCE) {
    return res.status(403).json({
      success: false,
      message: 'Can only reset password for finance users',
    });
  }

  // Update password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});