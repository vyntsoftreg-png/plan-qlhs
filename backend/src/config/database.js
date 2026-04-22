const { Pool } = require('pg');
const logger = require('../utils/logger');

require('dotenv').config();

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

// Handle pool errors gracefully — do NOT crash
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err.message);
});

// Test connection on startup with retry
const connectWithRetry = async (retries = 3, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      logger.info('✅ Database connection established');
      client.release();
      return;
    } catch (err) {
      logger.error(`Database connection attempt ${i}/${retries} failed: ${err.message}`);
      if (i < retries) {
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  logger.error('⚠️ Could not connect to database after retries. Server will continue running.');
};

connectWithRetry();

module.exports = pool;
