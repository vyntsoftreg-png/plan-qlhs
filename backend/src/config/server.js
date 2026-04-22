const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('express-async-errors');

const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const errorHandler = require('../middleware/errorHandler');

// Routes
const authRoutes = require('../routes/auth');
const usersRoutes = require('../routes/users');
const childrenRoutes = require('../routes/children');
const plansRoutes = require('../routes/plans');
const evaluationsRoutes = require('../routes/evaluations');
const analyticsRoutes = require('../routes/analytics');
const skillsRoutes = require('../routes/skills');
const templatesRoutes = require('../routes/templates');
const kindergartenRoutes = require('../routes/kindergarten');
const uploadRoutes = require('../routes/upload');
const publicLookupRoutes = require('../routes/publicLookup');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow requests with no origin (file://, mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, true);
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ============================================
// BODY PARSER
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ============================================
// LOGGING
// ============================================
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')
);

// ============================================
// HEALTH CHECK ENDPOINT
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  });
});

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// ============================================
// API ROUTES
// ============================================
const apiPrefix = `/api/v${process.env.API_VERSION || '1'}`;

// Public routes (no authentication required)
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/public`, publicLookupRoutes);

// Protected routes (authentication required)
app.use(`${apiPrefix}/upload`, authenticate, uploadRoutes);

// Protected routes (authentication required)
app.use(`${apiPrefix}/users`, authenticate, usersRoutes);
app.use(`${apiPrefix}/children`, authenticate, childrenRoutes);
app.use(`${apiPrefix}/plans`, authenticate, plansRoutes);
app.use(
  `${apiPrefix}/plans/:planId/evaluate`,
  authenticate,
  evaluationsRoutes
);
app.use(`${apiPrefix}/analytics`, authenticate, analyticsRoutes);
app.use(`${apiPrefix}/skills`, authenticate, skillsRoutes);
app.use(`${apiPrefix}/templates`, authenticate, templatesRoutes);
app.use(`${apiPrefix}/kindergarten`, authenticate, kindergartenRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// ERROR HANDLER (MUST BE LAST)
// ============================================
app.use(errorHandler);

module.exports = app;
