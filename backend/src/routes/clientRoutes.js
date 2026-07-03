const express = require('express');
const {
  createClient,
  getAllClients,
  getClient,
  updateClient,
  deleteClient,
  getClientStats,
} = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Individual route authorization
router.post('/', authorize('MANAGE_CLIENTS'), createClient);
router.get('/', authorize('MANAGE_CLIENTS'), getAllClients);
router.get('/:id', authorize('MANAGE_CLIENTS'), getClient);
router.get('/', authorize('VIEW_ALL_CLIENTS'), getAllClients);
router.get('/:id/stats', authorize('MANAGE_CLIENTS'), getClientStats);
router.put('/:id', authorize('MANAGE_CLIENTS'), updateClient);
router.delete('/:id', authorize('MANAGE_CLIENTS'), deleteClient);

module.exports = router;