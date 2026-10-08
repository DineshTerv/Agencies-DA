const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new user (anyone can self-register)
router.post('/register', authController.register);

// Login — returns role + token, frontend redirects based on role
router.post('/login', authController.login);

module.exports = router;
