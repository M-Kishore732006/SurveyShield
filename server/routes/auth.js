const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route POST api/auth/login
// @desc Login user and get token
// @access Public
router.post('/login', authController.login);

module.exports = router;
