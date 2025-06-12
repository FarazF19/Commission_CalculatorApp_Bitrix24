const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireAdmin, checkDataAccess, optionalAuth } = require('../middleware/auth');
const { upload, handleUploadErrors } = require('../middleware/upload');

// Public/Optional auth routes
router.get('/', optionalAuth, transactionController.getTransactions);
router.post('/calculate-commission', optionalAuth, transactionController.calculateCommission);

// Protected routes (require authentication)
router.post('/upload', 
  authenticateToken,
  requireAdmin, // Only admins can upload files
  upload,
  handleUploadErrors,
  transactionController.uploadFile
);

router.get('/:id', 
  authenticateToken,
  transactionController.getTransactionById
);

// Admin only routes
router.put('/:id', 
  authenticateToken,
  requireAdmin,
  transactionController.updateTransaction
);

router.delete('/:id', 
  authenticateToken,
  requireAdmin,
  transactionController.deleteTransaction
);

module.exports = router; 