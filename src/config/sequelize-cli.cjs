// Read by sequelize-cli via require(), so it must stay CommonJS even though the
// app is an ES module. The .cjs extension is what makes that possible.
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const base = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  dialect: 'postgres',
  logging: false,
};

// sequelize-cli expects one block per environment name.
module.exports = {
  development: { ...base, database: process.env.DB_NAME },
  // Derived name keeps test runs away from development data.
  test: { ...base, database: process.env.DB_NAME_TEST ?? `${process.env.DB_NAME}_test` },
  production: { ...base, database: process.env.DB_NAME },
};
