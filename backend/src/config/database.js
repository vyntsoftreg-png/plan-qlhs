const { Pool } = require('pg');
const logger = require('../utils/logger');

require('dotenv').config();

// Support DATABASE_URL (Railway/Neon) or individual vars
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      min: 0,
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 30000,
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      min: 0,
      max: parseInt(process.env.DB_POOL_MAX) || 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 30000,
      ssl:
        process.env.DB_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
    };

const pool = new Pool(poolConfig);

// Handle pool errors gracefully — do NOT crash the process
pool.on('error', (err) => {
  logger.error('Pool idle client error (non-fatal):', err.message);
});

// Test connection on startup
(async () => {
  try {
    const client = await pool.connect();
    logger.info('✅ Database connection established');
    client.release();
  } catch (err) {
    logger.error('⚠️ Initial DB connection failed:', err.message);
    logger.error('Server will continue — queries will retry on demand.');
  }
})();

module.exports = pool;
