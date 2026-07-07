const express = require('express');
const {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  resetPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

// All user routes require authentication and admin role
router.use(protect);
router.use(authorize('MANAGE_FINANCE_USERS'));

// Create finance user
router.post('/', createUser);

// Get all finance users
router.get('/', getAllUsers);

// Get single user
router.get('/:id', getUser);

// Update user
router.put('/:id', updateUser);

// Reset password
router.put('/:id/reset-password', resetPassword);

// Delete/Deactivate user
router.delete('/:id', deleteUser);

module.exports = router;