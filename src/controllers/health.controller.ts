import type { Request, Response } from 'express';
import { sequelize } from '../config/database.js';
import { env } from '../config/env.js';

/**
 * Controller: "Health Check"
 * 
 * WHY: Cloud providers (like AWS, Google Cloud, Docker) need to know if your server is alive and functioning.
 * If this endpoint returns an error, the cloud provider will automatically restart the server or stop sending it traffic.
 * 
 * FLOW:
 * 1. An automated system (Load Balancer) sends a GET request to `/api/health` every few seconds.
 * 2. This function tests the database connection.
 * 3. It returns a JSON summary of the app's health and latency.
 */
export async function healthController(_req: Request, res: Response): Promise<void> {
  let database: 'up' | 'down';
  let databaseLatencyMs: number | null = null;

  // FLOW: Start a high-resolution timer to measure exactly how long the database takes to respond.
  const startedAt = process.hrtime.bigint();
  
  try {
    // FLOW: Try to run a lightweight query to the database to ensure the connection is active.
    await sequelize.authenticate();
    database = 'up';
    
    // FLOW: Stop the timer and convert nanoseconds to milliseconds.
    databaseLatencyMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
  } catch {
    // WHY catch: If the DB is down, we don't want the whole app to crash with an unhandled exception.
    // We just mark it as down and let the load balancer handle the 503 response below.
    database = 'down';
  }

  const healthy = database === 'up';

  // WHY 503: HTTP 503 means "Service Unavailable". Load balancers understand this and will 
  // route traffic to a different, healthy server instance instead of showing errors to users.
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    service: 'legal-sys-api',
    environment: env.NODE_ENV,
    database,
    databaseLatencyMs: databaseLatencyMs === null ? null : Math.round(databaseLatencyMs),
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
