const express = require('express');
const router = express.Router();
const { register, login, getMe, updatePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

// Public routes
router.post('/register', validate('registerUser'), register);
router.post('/login', validate('loginUser'), login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);

module.exports = router;