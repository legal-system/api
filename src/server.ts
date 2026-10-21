import { createApp } from './app.js';
import { sequelize } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

// The app itself is built in app.ts; this file owns the process lifecycle and network port.
const app = createApp();

// Start the HTTP server on the configured port.
const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'legal-sys-api listening');
  
});

// Safety net: if the server takes too long to shut down gracefully, we force kill it.
const forceExitAfterMs = 10_000;

// This function handles "graceful shutdown", ensuring all in-flight requests finish 
// and database connections are closed cleanly before the server exits.
function shutdown(signal: string): void {
  logger.info({ signal }, 'shutdown initiated');

  // 1. Start a countdown timer. If this timer finishes, the process exits forcefully.
  const forceExit = setTimeout(() => {
    logger.fatal({ forceExitAfterMs }, 'graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, forceExitAfterMs);
  
  // unref() ensures this timer doesn't keep the event loop alive if everything else finishes early.
  forceExit.unref();

  // 2. Stop accepting new HTTP requests (but finish existing ones).
  server.close((closeError) => {
    if (closeError) {
      logger.error({ err: closeError }, 'error while closing http server');
    }

    // 3. Once HTTP server is closed, close the database connection pool cleanly.
    // sequelize.close() is asynchronous, so we wait for it to finish.
    void sequelize
      .close()
      .then(() => {
        logger.info('database pool closed');
      })
      .catch((dbError: unknown) => {
        logger.error({ err: dbError }, 'error while closing database pool');
      })
      .finally(() => {
        // 4. Cancel the timeout and exit the process.
        clearTimeout(forceExit);
        process.exit(closeError ? 1 : 0);
      });
  });
}

// OS Signals for shutting down the server

// SIGINT is triggered by Ctrl+C in the terminal.
process.on('SIGINT', () => {
  shutdown('SIGINT');
});

// SIGTERM is sent by container orchestrators (like Docker or Kubernetes) asking the app to stop gracefully.
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

// Error handling for the Node.js process

// 'unhandledRejection' catches asynchronous Promise errors that were not caught with .catch() or try/catch.
// We just log it here because Node can usually continue running, but it's important to fix these.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'unhandled promise rejection');
});

// 'uncaughtException' catches synchronous errors that crash the app.
// Since the app is in an undefined state, we log the error and forcefully trigger a graceful shutdown.
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'uncaught exception');
  shutdown('uncaughtException');
});
