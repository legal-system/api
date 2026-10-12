import { randomUUID } from 'node:crypto';
import { QueryInterface, type QueryOptions } from 'sequelize';
import { hashPassword } from '../../utils/password.js';

// Demo seed data for local development and testing
const DEMO_USERS = [
  {
    full_name: 'Demo Admin',
    email: 'admin@legalsys.test',
    status: 'ACTIVE',
  },
  {
    full_name: 'Demo Suspended',
    email: 'suspended@legalsys.test',
    status: 'SUSPENDED',
  },
] as const;

const DEMO_PASSWORD = 'Passw0rd!2026';

// Prevents crashes if seed is re-run (becomes "ON CONFLICT DO NOTHING" in SQL)
const insertOptions: QueryOptions & { ignoreDuplicates?: boolean } = {
  ignoreDuplicates: true,
};

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Step 1: Hash the password once and reuse to avoid slow repeated hashing
  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const now = new Date();

  // Step 2: Bulk insert demo users in a single query
  await queryInterface.bulkInsert(
    'users',
    DEMO_USERS.map((user) => ({
      id: randomUUID(),
      full_name: user.full_name,
      email: user.email,
      password_hash: passwordHash,
      status: user.status,
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })),
    insertOptions,
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Step 1: Remove demo users matching the seed emails
  const emails = DEMO_USERS.map((user) => user.email);
  await queryInterface.bulkDelete('users', { email: emails });
}
