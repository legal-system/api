// Sets up the connection only. Table structure is owned by the migrations.
import { Sequelize } from 'sequelize';
import { env, isProduction, isTest } from './env.js';
import { logger } from './logger.js';

export const sequelize = new Sequelize(
  env.DB_NAME,
  env.DB_USER,
  env.DB_PASSWORD,
  {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: 'postgres',

    // Query logging is only useful while debugging, so it is not always on.
    logging: env.LOG_LEVEL === 'debug' ? (message: string): void => logger.debug(message) : false,

    define: {
      underscored: true,
      freezeTableName: true,
    },

    // Connections are reused across requests; a fresh one per request is slow.
    pool: {
      max: isProduction ? 20 : isTest ? 5 : 10,
      min: 0,
      // Wait this long for a free connection before failing the query.
      acquire: 30_000,
      idle: 10_000,
    },
  },
);
