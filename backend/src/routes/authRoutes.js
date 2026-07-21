const express = require('express');
const { protect } = require('../middleware/auth');
const {
  login,
  getMe,
  registerClient,
  registerFinance,
} = require('../controllers/authController');
const router = express.Router();
router.post('/login', login);
router.post('/register-client', registerClient);
router.post('/register-finance', registerFinance);
router.post('/register-admin', RegisterAdmin);
router.get('/me', protect, getMe);
module.exports = router;