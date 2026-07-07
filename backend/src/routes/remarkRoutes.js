const express = require('express');
const { addRemark, getRemarks } = require('../controllers/remarkController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/:invoiceId', addRemark);
router.get('/:invoiceId', getRemarks);

module.exports = router;