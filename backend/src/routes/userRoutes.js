const express = require('express');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  approveUser,
  rejectUser,
  resetPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get all users (admin only)
router.get('/', authorize('MANAGE_USERS'), getUsers);

// Get single user (admin only)
router.get('/:id', authorize('MANAGE_USERS'), getUser);

// Create finance user (admin only)
router.post('/', authorize('MANAGE_USERS'), createUser);

// Update user (admin only)
router.put('/:id', authorize('MANAGE_USERS'), updateUser);

// Approve pending finance user (admin only)
router.put('/:id/approve', authorize('MANAGE_USERS'), approveUser);

// Reject pending finance user (admin only)
router.put('/:id/reject', authorize('MANAGE_USERS'), rejectUser);

// Reset user password (admin only)
router.put('/:id/reset-password', authorize('MANAGE_USERS'), resetPassword);

// Delete/Deactivate user (admin only)
router.delete('/:id', authorize('MANAGE_USERS'), deleteUser);

module.exports = router;