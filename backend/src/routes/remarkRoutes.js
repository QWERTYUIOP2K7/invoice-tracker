const express = require('express');
const { addRemark, getRemarks } = require('../controllers/remarkController');
const { protect } = require('../middleware/auth');
const router = express.Router();
router.use(protect);
// Get remarks for an invoice
// Admin can view any invoice's remarks, Finance/Client can only view their own
router.get('/:invoiceId', protect, getRemarks);

// Add remark to an invoice
// Admin can add to any, Finance/Client can only add to their own
router.post('/:invoiceId', protect, addRemark);

module.exports = router;