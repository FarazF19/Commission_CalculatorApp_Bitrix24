const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const authController = {
  // Login user
  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      // Authenticate user
      const user = await User.authenticate(username, password);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            assigned_mids: user.assigned_mids,
            assigned_dbas: user.assigned_dbas
          },
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  },

  // Register new user (admin only)
  register: async (req, res) => {
    try {
      const { username, email, password, role, assigned_mids, assigned_dbas } = req.body;

      // Validate input
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }

      // Validate role
      if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be "admin" or "user"'
        });
      }

      // Create user
      const user = await User.create({
        username,
        email,
        password,
        role: role || 'user',
        assigned_mids: assigned_mids || [],
        assigned_dbas: assigned_dbas || []
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            assigned_mids: user.assigned_mids,
            assigned_dbas: user.assigned_dbas
          }
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  },

  // Get current user profile
  getProfile: async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role,
            assigned_mids: req.user.assigned_mids,
            assigned_dbas: req.user.assigned_dbas
          }
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile'
      });
    }
  },

  // Update user profile
  updateProfile: async (req, res) => {
    try {
      const { email } = req.body;
      const allowedUpdates = { email };
      
      // Remove undefined values
      Object.keys(allowedUpdates).forEach(key => 
        allowedUpdates[key] === undefined && delete allowedUpdates[key]
      );

      if (Object.keys(allowedUpdates).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const updatedUser = await User.updateById(req.user.id, allowedUpdates);

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required'
        });
      }

      // Verify current password
      const user = await User.findByUsername(req.user.username);
      const isValidPassword = await User.verifyPassword(currentPassword, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await User.updatePassword(req.user.id, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  },

  // Get all users (admin only)
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll();

      res.json({
        success: true,
        data: {
          users,
          count: users.length
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get users'
      });
    }
  },

  // Update user (admin only)
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { email, role, assigned_mids, assigned_dbas } = req.body;

      const updateData = {};
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (assigned_mids !== undefined) updateData.assigned_mids = assigned_mids;
      if (assigned_dbas !== undefined) updateData.assigned_dbas = assigned_dbas;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const updatedUser = await User.updateById(id, updateData);

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          user: updatedUser
        }
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user'
      });
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (parseInt(id) === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const deletedUser = await User.deleteById(id);

      if (!deletedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        data: {
          user: deletedUser
        }
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user'
      });
    }
  }
};

module.exports = authController; 