require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const app = require('./config/server');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const HOSTNAME = process.env.APP_HOSTNAME || '0.0.0.0';

// Start server
const server = app.listen(PORT, HOSTNAME, () => {
  logger.info(`Server started | env=${process.env.NODE_ENV || 'development'} | http://${HOSTNAME}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  // Do NOT exit — Neon idle disconnects trigger this
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Do NOT exit — keep server running
});

module.exports = server;
