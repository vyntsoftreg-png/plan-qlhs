/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'qlhs_test';
process.env.DB_USER = 'qlhs_user';
process.env.DB_PASSWORD = 'test_password';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_key_minimum_32_chars_!!!';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_minimum_32_chars_!!!';
process.env.JWT_ACCESS_EXPIRES = '1h';
process.env.JWT_REFRESH_EXPIRES = '7d';

// Suppress logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
