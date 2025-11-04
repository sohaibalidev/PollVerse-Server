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

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const appConfig = require("./config/app.config");
const indexRoutes = require("./routes/index.routes");

const app = express();

/* ===========================
   GLOBAL MIDDLEWARES
   =========================== */

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Security headers (enabled in non-dev environments)
if (appConfig.NODE_ENV !== "development") {
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    })
  );
}

// CORS configuration
app.use(
  cors({
    origin: appConfig.FRONTEND_URL,
    credentials: true,
  })
);

// Simple request logger
// app.use((req, res, next) => {
//   console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
//   next();
// });

/* ===========================
   ROOT & HEALTH ROUTES
   =========================== */

app.get("/", (req, res) => {
  res.status(200).json({
    name: "PollVerse API",
    description:
      "Precision URL shortener built with Node.js, Express, and MongoDB.",
    repositories: {
      backend: "https://github.com/sohaibalidev/pollverse-server",
      frontend: "https://github.com/sohaibalidev/pollverse-client",
    },
    live: {
      frontend: "https://pollverse.netlify.app",
      backend: "https://pollverse-server.onrender.com",
    },
    author: "Muhammad Sohaib Ali",
    status: "online",
  });
});

/* ===========================
   API ROUTES
   =========================== */

app.use("/api", indexRoutes);

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
  if (appConfig.NODE_ENV === "development") console.error("Error:", err);

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation Error", errors });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(400)
      .json({ success: false, message: `${field} already exists` });
  }

  if (err.name === "JsonWebTokenError")
    return res.status(401).json({ success: false, message: "Invalid token" });

  if (err.name === "TokenExpiredError")
    return res.status(401).json({ success: false, message: "Token expired" });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

module.exports = app;
