const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { ROLES } = require('../config/permissions');
const Client = require('../models/Client');
const bcrypt = require('bcryptjs');


// @route   POST /api/users
// @access  Private/Admin
// @desc    Create finance user
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, clientId } = req.body;

  // Validate input
  if (!name || !email || !password || !clientId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Only admin can create users
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can create users',
    });
  }

  // Check if user already exists
  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      success: false,
      message: 'Email already in use',
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

  // Create user
  user = await User.create({
    name,
    email,
    password,
    role: ROLES.FINANCE,
    clientId,
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      clientId: user.clientId,
    },
  });
});

// @route   PUT /api/users/:id/approve
// @access  Private/Admin
// @desc    Approve pending finance user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
// @desc    Approve pending finance user
exports.approveUser = asyncHandler(async (req, res) => {
  const { clientIds } = req.body; // Array of client IDs

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `Not authorized`,
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.status !== 'pending_approval') {
    return res.status(400).json({
      success: false,
      message: 'User is not pending approval',
    });
  }

  // For finance users: assign multiple clients
  if (user.role === 'finance' && clientIds && clientIds.length > 0) {
    const Client = require('../models/Client');
    const clients = await Client.find({ _id: { $in: clientIds } });
    
    if (clients.length !== clientIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more clients not found',
      });
    }

    user.assignedClients = clientIds;
    user.clientId = clientIds[0]; // Set first as primary
  }

  // Approve user
  user.status = 'active';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User approved successfully',
    user,
  });
});

// @route   PUT /api/users/:id/reject
// @access  Private/Admin
// @desc    Reject pending finance user
exports.rejectUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }

  // Only admin can reject
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: `Not authorized. Your role is: ${req.user.role}`,
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Can only reject pending users
  if (user.status !== 'pending_approval') {
    return res.status(400).json({
      success: false,
      message: 'User is not pending approval',
    });
  }

  // Reject by deactivating
  user.status = 'inactive';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User rejected',
    user,
  });
});
// @route   PUT /api/users/:id/reactivate
// @access  Private/Admin
// @desc    Reactivate an inactive user
exports.reactivateUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.status !== 'inactive') {
    return res.status(400).json({
      success: false,
      message: 'User is not inactive',
    });
  }

  user.status = 'active';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'User reactivated successfully',
    user,
  });
});

// @route   DELETE /api/users/:id
// @access  Private/Admin
// @desc    Deactivate user (soft delete)
exports.deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Admin can deactivate any user (finance or client)
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can deactivate users',
    });
  }

  // Prevent deactivating the only active admin
  if (user.role === ROLES.ADMIN) {
    const activeAdmins = await User.countDocuments({
      role: ROLES.ADMIN,
      status: 'active',
      _id: { $ne: id }, // Exclude this user
    });

    if (activeAdmins === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate the last active admin user',
      });
    }
  }

  // Soft delete - set status to inactive
  user.status = 'inactive';
  await user.save();

  res.status(200).json({
    success: true,
    message: `${user.role} user deactivated successfully`,
  });
});

// @route   GET /api/users
// @access  Private/Admin
// @desc    Get all users (finance and clients)
exports.getUsers = asyncHandler(async (req, res) => {
  const { search, status, role } = req.query;

  // Only admin can view all users
  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can view all users',
    });
  }

  // Build filter
  const filter = {};
  
  if (status) {
    filter.status = status;
  }

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .populate('clientId', 'clientCode companyName')
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
// @desc    Get single user
exports.getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can view user details',
    });
  }

  const user = await User.findById(id)
    .populate('clientId', 'clientCode companyName')
    .select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// @route   PUT /api/users/:id
// @access  Private/Admin
// @desc    Update user
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can update users',
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // Update allowed fields
  if (name) user.name = name;
  if (email) {
    // Check email uniqueness
    const existingUser = await User.findOne({
      email,
      _id: { $ne: id },
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use',
      });
    }
    user.email = email;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
// @desc    Reset user password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a new password',
    });
  }

  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Only admins can reset passwords',
    });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successfully',
  });
});