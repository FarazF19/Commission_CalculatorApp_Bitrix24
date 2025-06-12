const Transaction = require('../models/Transaction');
const User = require('../models/User');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { cleanupFile } = require('../middleware/upload');

const transactionController = {
  // Upload and parse CSV/Excel file
  uploadFile: async (req, res) => {
    let filePath = null;

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      let transactions = [];

      if (fileExtension === '.csv') {
        // Parse CSV file
        transactions = await parseCSVFile(filePath);
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        // Parse Excel file
        transactions = await parseExcelFile(filePath);
      } else {
        throw new Error('Unsupported file format');
      }

      if (transactions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid transactions found in the file'
        });
      }

      // Validate and clean transaction data
      const validTransactions = [];
      const errors = [];

      for (let i = 0; i < transactions.length; i++) {
        try {
          const cleanedTransaction = cleanTransactionData(transactions[i], i + 1);
          validTransactions.push(cleanedTransaction);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      if (validTransactions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid transactions found',
          errors: errors.slice(0, 10) // Show first 10 errors
        });
      }

      // Bulk insert transactions
      const insertedTransactions = await Transaction.bulkCreate(validTransactions);

      res.json({
        success: true,
        message: 'File uploaded and processed successfully',
        data: {
          totalProcessed: transactions.length,
          totalInserted: insertedTransactions.length,
          totalErrors: errors.length,
          insertedTransactions: insertedTransactions.slice(0, 5), // Show first 5 for confirmation
          errors: errors.slice(0, 10) // Show first 10 errors
        }
      });

    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process file',
        error: error.message
      });
    } finally {
      // Clean up uploaded file
      if (filePath) {
        cleanupFile(filePath);
      }
    }
  },

  // Get transactions with filtering and pagination
  getTransactions: async (req, res) => {
    try {
      const { 
        mid, 
        dba, 
        month, 
        year, 
        responsible,
        page = 1, 
        limit = 100 
      } = req.query;

      const filters = {};
      if (mid) filters.mid = mid;
      if (dba) filters.dba = dba;
      if (month) filters.month = month;
      if (year) filters.year = year;
      if (responsible) filters.responsible = responsible;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      let transactions;
      let totalCount;

      if (req.user && req.user.role === 'admin') {
        // Admin can see all transactions
        transactions = await Transaction.findAll(filters, parseInt(limit), offset);
        totalCount = await Transaction.getCount(filters);
      } else if (req.user) {
        // Regular user sees only their assigned transactions
        transactions = await Transaction.findByUserAccess(
          req.user.id, 
          req.user.role, 
          filters, 
          parseInt(limit), 
          offset
        );
        // For regular users, we need a separate count method with access restrictions
        // For now, we'll estimate from the results
        totalCount = transactions.length === parseInt(limit) ? parseInt(limit) * parseInt(page) + 1 : parseInt(limit) * (parseInt(page) - 1) + transactions.length;
      } else {
        // No authentication - return empty result
        transactions = [];
        totalCount = 0;
      }

      res.json({
        success: true,
        data: {
          transactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / parseInt(limit)),
            totalCount,
            limit: parseInt(limit)
          },
          filters
        }
      });

    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transactions'
      });
    }
  },

  // Calculate commission based on filters
  calculateCommission: async (req, res) => {
    try {
      const { mid, dba, month, year, responsible } = req.body;

      const filters = {};
      if (mid) filters.mid = mid;
      if (dba) filters.dba = dba;
      if (month) filters.month = month;
      if (year) filters.year = year;
      if (responsible) filters.responsible = responsible;

      // For regular users, we need to check if they have access to the requested data
      if (req.user && req.user.role !== 'admin') {
        const hasAccess = await User.hasAccessTo(req.user.id, mid, dba);
        if (!hasAccess && (mid || dba)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied for the requested data'
          });
        }
      }

      const result = await Transaction.calculateCommission(filters);

      res.json({
        success: true,
        data: {
          ...result,
          filters
        }
      });

    } catch (error) {
      console.error('Calculate commission error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate commission'
      });
    }
  },

  // Get transaction by ID
  getTransactionById: async (req, res) => {
    try {
      const { id } = req.params;

      const transaction = await Transaction.findById(id);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Check access for regular users
      if (req.user && req.user.role !== 'admin') {
        const hasAccess = await User.hasAccessTo(req.user.id, transaction.mid, transaction.dba);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied for this transaction'
          });
        }
      }

      res.json({
        success: true,
        data: {
          transaction
        }
      });

    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get transaction'
      });
    }
  },

  // Delete transaction (admin only)
  deleteTransaction: async (req, res) => {
    try {
      const { id } = req.params;

      const deletedTransaction = await Transaction.deleteById(id);

      if (!deletedTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Transaction deleted successfully',
        data: {
          transaction: deletedTransaction
        }
      });

    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction'
      });
    }
  },

  // Update transaction (admin only)
  updateTransaction: async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const updatedTransaction = await Transaction.updateById(id, updateData);

      if (!updatedTransaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: {
          transaction: updatedTransaction
        }
      });

    } catch (error) {
      console.error('Update transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction'
      });
    }
  }
};

// Helper function to parse CSV file
const parseCSVFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const transactions = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        transactions.push(data);
      })
      .on('end', () => {
        resolve(transactions);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Helper function to parse Excel file
const parseExcelFile = (filePath) => {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

// Helper function to clean and validate transaction data
const cleanTransactionData = (row, rowNumber) => {
  // Map common column name variations
  const columnMapping = {
    'statement_month': ['statement_month', 'statementMonth', 'statement month', 'month'],
    'mid': ['mid', 'MID', 'merchant_id', 'merchantId'],
    'dba': ['dba', 'DBA', 'business_name', 'businessName', 'merchant_name'],
    'sales_volume': ['sales_volume', 'salesVolume', 'sales volume', 'volume'],
    'sales_txn': ['sales_txn', 'salesTxn', 'sales txn', 'sales_transaction', 'transactions'],
    'commission': ['commission', 'Commission', 'commission_amount'],
    'responsible': ['responsible', 'Responsible', 'responsible_person', 'sales_person'],
    'earnings': ['earnings', 'Earnings', 'commission_earnings', 'total_earnings']
  };

  const cleanedData = {};

  // Map and clean each field
  for (const [standardField, variations] of Object.entries(columnMapping)) {
    let value = null;
    
    // Find the field value from variations
    for (const variation of variations) {
      if (row[variation] !== undefined && row[variation] !== null && row[variation] !== '') {
        value = row[variation];
        break;
      }
    }

    // Clean and validate the value
    switch (standardField) {
      case 'statement_month':
        if (!value) throw new Error('Statement month is required');
        cleanedData.statement_month = String(value).trim();
        break;
        
      case 'mid':
        if (!value) throw new Error('MID is required');
        cleanedData.mid = String(value).trim();
        break;
        
      case 'dba':
        if (!value) throw new Error('DBA is required');
        cleanedData.dba = String(value).trim();
        break;
        
      case 'sales_volume':
        cleanedData.sales_volume = parseFloat(value) || 0;
        break;
        
      case 'sales_txn':
        cleanedData.sales_txn = parseFloat(value) || 0;
        break;
        
      case 'commission':
        cleanedData.commission = parseFloat(value) || 0;
        break;
        
      case 'responsible':
        cleanedData.responsible = value ? String(value).trim() : null;
        break;
        
      case 'earnings':
        cleanedData.earnings = parseFloat(value) || 0;
        break;
    }
  }

  return cleanedData;
};

module.exports = transactionController; 