const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'jiggle_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

// Database initialization script
const initializeDatabase = async () => {
  try {
    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        statement_month VARCHAR(20) NOT NULL,
        mid VARCHAR(50) NOT NULL,
        dba VARCHAR(255) NOT NULL,
        sales_volume DECIMAL(12, 2) DEFAULT 0,
        sales_txn DECIMAL(12, 2) DEFAULT 0,
        commission DECIMAL(12, 2) DEFAULT 0,
        responsible VARCHAR(255),
        earnings DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create users table for role-based access
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        assigned_mids TEXT[], -- Array of MIDs the user can access
        assigned_dbas TEXT[], -- Array of DBAs the user can access
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_transactions_mid ON transactions(mid);
      CREATE INDEX IF NOT EXISTS idx_transactions_dba ON transactions(dba);
      CREATE INDEX IF NOT EXISTS idx_transactions_statement_month ON transactions(statement_month);
      CREATE INDEX IF NOT EXISTS idx_transactions_responsible ON transactions(responsible);
    `);

    // Insert default admin user (password: admin123)
    await pool.query(`
      INSERT INTO users (username, email, password_hash, role) 
      VALUES ('admin', 'admin@jiggle-crm.com', '$2a$10$8K1p/a0dUZwk7Q2Y.VqJa.qNd0qgm.ZjQX3qN0q8Y.VqJa.qNd0qgm', 'admin')
      ON CONFLICT (username) DO NOTHING;
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
}; 