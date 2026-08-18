const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// @route POST api/auth/login
// @desc Login user and get token
// @access Public
router.post('/login', authController.login);

// @route GET api/auth/profile
// @desc Get current user's profile details
// @access Private
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;
