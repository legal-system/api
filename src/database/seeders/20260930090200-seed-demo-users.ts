import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import { QueryInterface } from 'sequelize';

/**
 * Seeder File: "Seed Demo Users"
 * 
 * WHY: When you set up a project locally, your database is completely empty. 
 * Seeders automatically populate the database with dummy data so you can log in, 
 * click around, and test the UI immediately without having to manually register users.
 */

// This is the dummy data we want to insert.
const DEMO_USERS = [
  {
    full_name: 'Demo Admin',
    email: 'admin@legalsys.test',
    status: 'ACTIVE',
  },
  {
    full_name: 'Demo Suspended',
    email: 'suspended@legalsys.test',
    // WHY SUSPENDED: By seeding a suspended user, you can easily test that your login logic 
    // correctly rejects users who shouldn't have access.
    status: 'SUSPENDED',
  },
] as const;

const DEMO_PASSWORD = 'Passw0rd!2026';

// 12 rounds is the current industry standard for bcrypt. It makes hashing slow intentionally,
// preventing hackers from quickly guessing passwords if the database is leaked.
const SALT_ROUNDS = 12;

/**
 * FLOW (UP): Runs when you execute `npx sequelize-cli db:seed:all`.
 * It prepares the data and inserts it into the database.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  // FLOW: Hash the password once before the loop.
  // WHY: Hashing is computationally expensive. Hashing it once and reusing the hash
  // for all demo users makes the seeder run much faster.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
  const now = new Date();

  // FLOW: Use bulkInsert to insert multiple rows in a single database query for efficiency.
  await queryInterface.bulkInsert(
    'users',
    DEMO_USERS.map((user) => ({
      // WHY randomUUID: Since the DB doesn't auto-generate UUIDs for raw bulk inserts, we generate them here in Node.js.
      id: randomUUID(),
      full_name: user.full_name,
      email: user.email,
      password_hash: passwordHash,
      status: user.status,
      // WHY verified: We mark them as verified so we don't have to build/test the email verification flow right now.
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    })),
  );
}

/**
 * FLOW (DOWN): Runs when you execute `npx sequelize-cli db:seed:undo`.
 * It removes exactly the records that the `up` function inserted.
 */
export async function down(queryInterface: QueryInterface): Promise<void> {
  const emails = DEMO_USERS.map((user) => user.email);
  
  // FLOW: Find all users where the email matches our demo emails, and delete them.
  // WHY: We don't want to accidentally delete REAL users if this is run in a staging environment.
  await queryInterface.bulkDelete('users', { email: emails });
}
