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
  min: parseInt(process.env.DB_POOL_MIN) || 5,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
});

// Handle pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', err);
});

// Test connection on startup
pool.connect(async (err, client, release) => {
  if (err) {
    logger.error('Failed to connect to database:', err);
  } else {
    logger.info('✅ Database connection established');
    release();
  }
});

module.exports = pool;
