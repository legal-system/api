// Builds and configures Express. This file does not open a port — server.ts does.
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/error.middleware.js';
import apiRouter from './routes/index.js';

export function createApp(): express.Express {
  // Initialize the Express application
  const app = express();

  // Hide the "X-Powered-By: Express" header to not leak our tech stack to attackers
  app.disable('x-powered-by');

  // Trusting proxy headers (like X-Forwarded-For) is required when running behind a load balancer (e.g. Nginx, AWS ALB).
  // If false, Express uses the immediate connection IP. If true, it trusts the proxy's IP.
  app.set('trust proxy', env.TRUST_PROXY ? 1 : false);

  // MIDDLEWARE PIPELINE: Order matters! Every incoming request goes through these top-to-bottom.

  // 1. Logging: pinoHttp automatically logs every incoming request and outgoing response
  app.use(pinoHttp({ logger }));
  
  // 2. Security Headers: helmet adds HTTP headers that protect against common web vulnerabilities (like XSS, clickjacking)
  app.use(helmet());
  
  // 3. CORS (Cross-Origin Resource Sharing): Allows the frontend (running on a different port/domain) to securely talk to this API
  // We use env.CORS_ORIGIN so it can be strictly set in production (no '*'). credentials: true allows sending cookies.
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  
  // 4. Body Parser: Parses incoming JSON payloads (e.g., POST request data) into req.body
  // Limit to 100kb to prevent Denial of Service (DoS) attacks via massive JSON payloads
  app.use(express.json({ limit: '100kb' }));
  
  // 5. Cookie Parser: Parses the Cookie header and populates req.cookies, which is useful for authentication (like refresh tokens)
  app.use(cookieParser());

  // Every route below is registered relative to this prefix.
  app.use('/api', apiRouter);

  // Must stay last: it turns any error the routes threw into a JSON response, and
  // without it Express would return a 500 that can expose a stack trace.
  app.use(errorHandler);

  return app;
}
