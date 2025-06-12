const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(userData) {
    const {
      username,
      email,
      password,
      role = 'user',
      assigned_mids = [],
      assigned_dbas = []
    } = userData;

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO users (username, email, password_hash, role, assigned_mids, assigned_dbas)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, email, role, assigned_mids, assigned_dbas, created_at;
    `;

    const values = [username, email, password_hash, role, assigned_mids, assigned_dbas];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Username or email already exists');
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by username
  static async findByUsername(username) {
    const query = `
      SELECT id, username, email, password_hash, role, assigned_mids, assigned_dbas, created_at, updated_at
      FROM users 
      WHERE username = $1
    `;
    
    try {
      const result = await pool.query(query, [username]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(id) {
    const query = `
      SELECT id, username, email, role, assigned_mids, assigned_dbas, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Error verifying password: ${error.message}`);
    }
  }

  // Authenticate user
  static async authenticate(username, password) {
    try {
      const user = await this.findByUsername(username);
      if (!user) {
        return null;
      }

      const isValidPassword = await this.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }

      // Return user without password hash
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw new Error(`Error authenticating user: ${error.message}`);
    }
  }

  // Get all users (admin only)
  static async findAll() {
    const query = `
      SELECT id, username, email, role, assigned_mids, assigned_dbas, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Update user
  static async updateById(id, updateData) {
    const allowedFields = ['email', 'role', 'assigned_mids', 'assigned_dbas'];
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
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, assigned_mids, assigned_dbas, updated_at;
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // Update password
  static async updatePassword(id, newPassword) {
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, username, email;
    `;

    try {
      const result = await pool.query(query, [password_hash, id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating password: ${error.message}`);
    }
  }

  // Delete user
  static async deleteById(id) {
    const query = `DELETE FROM users WHERE id = $1 RETURNING id, username, email`;
    
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting user: ${error.message}`);
    }
  }

  // Check if user has access to specific MID or DBA
  static async hasAccessTo(userId, mid = null, dba = null) {
    try {
      const user = await this.findById(userId);
      if (!user) {
        return false;
      }

      // Admin has access to everything
      if (user.role === 'admin') {
        return true;
      }

      // Check MID access
      if (mid && user.assigned_mids && user.assigned_mids.includes(mid)) {
        return true;
      }

      // Check DBA access
      if (dba && user.assigned_dbas && user.assigned_dbas.includes(dba)) {
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(`Error checking user access: ${error.message}`);
    }
  }
}

module.exports = User; 