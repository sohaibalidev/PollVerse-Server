/**
 * PollVerse - Main Server Entry Point
 *
 * Responsibilities:
 *  - Initialize the Express application
 *  - Connect to MongoDB via Mongoose
 *  - Load environment-based configurations
 *  - Start listening once the DB is connected
 */

const app = require('./src/app.js');
const { connectDB } = require('./src/config/db.config');
const config = require('./src/config/app.config');

/**
 * Start server only after successful DB connection
 */
connectDB()
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`[SERVER] Running at ${config.BASE_URL}`);
      console.log(`[CLIENT] ${config.FRONTEND_URL}`);
    });
  })
  .catch((err) => {
    console.error('[MONGO] Connection failed:', err.message || err);
    process.exit(1);
  });
