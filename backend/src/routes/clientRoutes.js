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

// All client routes require authentication and admin role
router.use(protect);
router.use(authorize('MANAGE_CLIENTS'));

router.post('/', createClient);
router.get('/', getAllClients);
router.get('/:id', getClient);
router.get('/:id/stats', getClientStats);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;