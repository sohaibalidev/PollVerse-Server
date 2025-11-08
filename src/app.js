/**
 * Express Application Setup
 * -------------------------
 * Handles:
 *  - Core Express app initialization
 *  - Global middleware registration
 *  - Security & CORS configuration
 *  - API route mounting
 *  - Centralized 404 & error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const appConfig = require('./config/app.config');
const pollRoutes = require('./routes/poll.routes');

const app = express();

/* ===========================
   GLOBAL MIDDLEWARES
   =========================== */

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

if (appConfig.NODE_ENV !== 'development') {
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );
}

app.use(
  cors({
    origin: appConfig.FRONTEND_URL,
    credentials: true,
  })
);

/* ===========================
   ROOT & HEALTH ROUTES
   =========================== */

app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Poll Verse API',
    description:
      'Precision URL shortener built with Node.js, Express, and MongoDB.',
    repositories: {
      backend: 'https://github.com/sohaibalidev/poll-verse-server',
      frontend: 'https://github.com/sohaibalidev/poll-verse-client',
    },
    live: {
      frontend: 'https://poll-verse.netlify.app',
      backend: 'https://poll-verse-server.onrender.com',
    },
    author: 'Muhammad Sohaib Ali',
    status: 'online',
  });
});

/* ===========================
   API ROUTES
   =========================== */

app.use('/api', pollRoutes);

/* ===========================
   404 HANDLER
   =========================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

/* ===========================
   GLOBAL ERROR HANDLER
   =========================== */

app.use((err, req, res, next) => {
  if (appConfig.NODE_ENV === 'development') console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: 'Validation Error', errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(400)
      .json({ success: false, message: `${field} already exists` });
  }

  if (err.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'Invalid token' });

  if (err.name === 'TokenExpiredError')
    return res.status(401).json({ success: false, message: 'Token expired' });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
