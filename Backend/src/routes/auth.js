const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Public routes
router.post('/login', authController.login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.post('/change-password', authenticateToken, authController.changePassword);

// Admin only routes
router.post('/register', authenticateToken, requireAdmin, authController.register);
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);
router.put('/users/:id', authenticateToken, requireAdmin, authController.updateUser);
router.delete('/users/:id', authenticateToken, requireAdmin, authController.deleteUser);

module.exports = router; 