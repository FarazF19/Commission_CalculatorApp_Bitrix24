const { pool } = require('../config/database');

class Transaction {
  // Create a new transaction
  static async create(transactionData) {
    const {
      statement_month,
      mid,
      dba,
      sales_volume = 0,
      sales_txn = 0,
      commission = 0,
      responsible,
      earnings = 0
    } = transactionData;

    const query = `
      INSERT INTO transactions (statement_month, mid, dba, sales_volume, sales_txn, commission, responsible, earnings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [statement_month, mid, dba, sales_volume, sales_txn, commission, responsible, earnings];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating transaction: ${error.message}`);
    }
  }

  // Bulk insert multiple transactions (for file uploads)
  static async bulkCreate(transactions) {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const insertPromises = transactions.map(transaction => {
        const {
          statement_month,
          mid,
          dba,
          sales_volume = 0,
          sales_txn = 0,
          commission = 0,
          responsible,
          earnings = 0
        } = transaction;

        const query = `
          INSERT INTO transactions (statement_month, mid, dba, sales_volume, sales_txn, commission, responsible, earnings)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *;
        `;

        const values = [statement_month, mid, dba, sales_volume, sales_txn, commission, responsible, earnings];
        return client.query(query, values);
      });

      const results = await Promise.all(insertPromises);
      await client.query('COMMIT');
      
      return results.map(result => result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Error bulk creating transactions: ${error.message}`);
    } finally {
      client.release();
    }
  }

  // Get all transactions with optional filtering
  static async findAll(filters = {}, limit = 100, offset = 0) {
    let query = `
      SELECT id, statement_month, mid, dba, sales_volume, sales_txn, commission, responsible, earnings, created_at, updated_at
      FROM transactions
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    // Apply filters
    if (filters.mid) {
      paramCount++;
      query += ` AND mid ILIKE $${paramCount}`;
      values.push(`%${filters.mid}%`);
    }

    if (filters.dba) {
      paramCount++;
      query += ` AND dba ILIKE $${paramCount}`;
      values.push(`%${filters.dba}%`);
    }

    if (filters.month) {
      paramCount++;
      query += ` AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(statement_month, 5, 2), 'MM')) = $${paramCount}`;
      values.push(parseInt(filters.month));
    }

    if (filters.year) {
      paramCount++;
      query += ` AND SUBSTRING(statement_month, 1, 4) = $${paramCount}`;
      values.push(filters.year);
    }

    if (filters.responsible) {
      paramCount++;
      query += ` AND responsible ILIKE $${paramCount}`;
      values.push(`%${filters.responsible}%`);
    }

    // Add ordering and pagination
    query += ` ORDER BY created_at DESC`;
    
    if (limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(limit);
    }

    if (offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);
    }

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching transactions: ${error.message}`);
    }
  }

  // Get total count of transactions with filters
  static async getCount(filters = {}) {
    let query = `SELECT COUNT(*) as total FROM transactions WHERE 1=1`;
    const values = [];
    let paramCount = 0;

    // Apply the same filters as findAll
    if (filters.mid) {
      paramCount++;
      query += ` AND mid ILIKE $${paramCount}`;
      values.push(`%${filters.mid}%`);
    }

    if (filters.dba) {
      paramCount++;
      query += ` AND dba ILIKE $${paramCount}`;
      values.push(`%${filters.dba}%`);
    }

    if (filters.month) {
      paramCount++;
      query += ` AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(statement_month, 5, 2), 'MM')) = $${paramCount}`;
      values.push(parseInt(filters.month));
    }

    if (filters.year) {
      paramCount++;
      query += ` AND SUBSTRING(statement_month, 1, 4) = $${paramCount}`;
      values.push(filters.year);
    }

    if (filters.responsible) {
      paramCount++;
      query += ` AND responsible ILIKE $${paramCount}`;
      values.push(`%${filters.responsible}%`);
    }

    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].total);
    } catch (error) {
      throw new Error(`Error counting transactions: ${error.message}`);
    }
  }

  // Calculate commission sum with filters
  static async calculateCommission(filters = {}) {
    let query = `
      SELECT 
        SUM(earnings) as total_earnings,
        SUM(commission) as total_commission,
        COUNT(*) as transaction_count
      FROM transactions 
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 0;

    // Apply filters
    if (filters.mid) {
      paramCount++;
      query += ` AND mid ILIKE $${paramCount}`;
      values.push(`%${filters.mid}%`);
    }

    if (filters.dba) {
      paramCount++;
      query += ` AND dba ILIKE $${paramCount}`;
      values.push(`%${filters.dba}%`);
    }

    if (filters.month) {
      paramCount++;
      query += ` AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(statement_month, 5, 2), 'MM')) = $${paramCount}`;
      values.push(parseInt(filters.month));
    }

    if (filters.year) {
      paramCount++;
      query += ` AND SUBSTRING(statement_month, 1, 4) = $${paramCount}`;
      values.push(filters.year);
    }

    if (filters.responsible) {
      paramCount++;
      query += ` AND responsible ILIKE $${paramCount}`;
      values.push(`%${filters.responsible}%`);
    }

    try {
      const result = await pool.query(query, values);
      const row = result.rows[0];
      return {
        totalEarnings: parseFloat(row.total_earnings) || 0,
        totalCommission: parseFloat(row.total_commission) || 0,
        transactionCount: parseInt(row.transaction_count) || 0
      };
    } catch (error) {
      throw new Error(`Error calculating commission: ${error.message}`);
    }
  }

  // Get transactions filtered by user role and permissions
  static async findByUserAccess(userId, userRole, filters = {}, limit = 100, offset = 0) {
    if (userRole === 'admin') {
      // Admin can see all transactions
      return this.findAll(filters, limit, offset);
    }

    // For regular users, get their assigned MIDs and DBAs
    const userQuery = `
      SELECT assigned_mids, assigned_dbas 
      FROM users 
      WHERE id = $1
    `;

    try {
      const userResult = await pool.query(userQuery, [userId]);
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const { assigned_mids, assigned_dbas } = userResult.rows[0];

      // Build query with user access restrictions
      let query = `
        SELECT id, statement_month, mid, dba, sales_volume, sales_txn, commission, responsible, earnings, created_at, updated_at
        FROM transactions
        WHERE (
      `;

      const accessConditions = [];
      const values = [];
      let paramCount = 0;

      // Add MID access conditions
      if (assigned_mids && assigned_mids.length > 0) {
        const midConditions = assigned_mids.map(() => {
          paramCount++;
          return `mid = $${paramCount}`;
        });
        accessConditions.push(`(${midConditions.join(' OR ')})`);
        values.push(...assigned_mids);
      }

      // Add DBA access conditions
      if (assigned_dbas && assigned_dbas.length > 0) {
        const dbaConditions = assigned_dbas.map(() => {
          paramCount++;
          return `dba = $${paramCount}`;
        });
        accessConditions.push(`(${dbaConditions.join(' OR ')})`);
        values.push(...assigned_dbas);
      }

      if (accessConditions.length === 0) {
        // User has no access
        return [];
      }

      query += accessConditions.join(' OR ') + ')';

      // Apply additional filters
      if (filters.mid) {
        paramCount++;
        query += ` AND mid ILIKE $${paramCount}`;
        values.push(`%${filters.mid}%`);
      }

      if (filters.dba) {
        paramCount++;
        query += ` AND dba ILIKE $${paramCount}`;
        values.push(`%${filters.dba}%`);
      }

      if (filters.month) {
        paramCount++;
        query += ` AND EXTRACT(MONTH FROM TO_DATE(SUBSTRING(statement_month, 5, 2), 'MM')) = $${paramCount}`;
        values.push(parseInt(filters.month));
      }

      if (filters.year) {
        paramCount++;
        query += ` AND SUBSTRING(statement_month, 1, 4) = $${paramCount}`;
        values.push(filters.year);
      }

      // Add ordering and pagination
      query += ` ORDER BY created_at DESC`;
      
      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        values.push(limit);
      }

      if (offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        values.push(offset);
      }

      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching user transactions: ${error.message}`);
    }
  }

  // Find transaction by ID
  static async findById(id) {
    const query = `
      SELECT id, statement_month, mid, dba, sales_volume, sales_txn, commission, responsible, earnings, created_at, updated_at
      FROM transactions 
      WHERE id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding transaction: ${error.message}`);
    }
  }

  // Delete a transaction by ID
  static async deleteById(id) {
    const query = `DELETE FROM transactions WHERE id = $1 RETURNING *`;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting transaction: ${error.message}`);
    }
  }

  // Update a transaction
  static async updateById(id, updateData) {
    const allowedFields = ['statement_month', 'mid', 'dba', 'sales_volume', 'sales_txn', 'commission', 'responsible', 'earnings'];
    const updateFields = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    paramCount++;
    values.push(id);

    const query = `
      UPDATE transactions 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating transaction: ${error.message}`);
    }
  }
}

module.exports = Transaction; 