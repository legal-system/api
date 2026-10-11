import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Migration File: "Create Users Table"
 * 
 * WHY: Migrations are version control for your database. Instead of manually creating tables
 * in a SQL client, you write a migration. This ensures that every developer (and the production server)
 * has the exact same database structure.
 * 
 * FLOW: 
 * 1. When you run `npx sequelize-cli db:migrate`, the `up` function runs, creating the table.
 * 2. If you ever need to rollback (undo), `npx sequelize-cli db:migrate:undo` runs the `down` function.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
  // FLOW: We use queryInterface to execute standard SQL commands (like CREATE TABLE) securely.
    id: {
    // WHY UUID: Instead of sequential IDs (1, 2, 3) which attackers can guess, we use UUIDs (random strings) for security.
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password_hash: {
    // WHY HASH: Never store plain-text passwords. We store a cryptographic hash so even if the DB is stolen, passwords remain safe.
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'ACTIVE', // Default to active immediately upon creation
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
    // WHY DELETED_AT: This enables "Soft Deletes". When a user is "deleted", we just set this timestamp.
    // This preserves audit logs, which is essential for a Legal system!
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  // FLOW: After creating the table, we add database indexes. 
  // WHY INDEXES: Indexes are like a book's table of contents. They make searching incredibly fast.
  
  // 1. Ensure no two users have the same email.
  await queryInterface.addIndex('users', {
    name: 'users_email_unique',
    unique: true,
    fields: ['email'],
  });

  await queryInterface.addIndex('users', {
  // 2. Speed up queries that filter by status (e.g., "Find all suspended users").
    name: 'users_status_idx',
    fields: ['status'],
  });

  // WHY CONSTRAINT: This is the ultimate safety net. Even if our app code has a bug, the database itself
  // will physically refuse to save a status that isn't 'ACTIVE' or 'SUSPENDED'.
  await queryInterface.addConstraint('users', {
    name: 'users_status_check',
    type: 'check',
    fields: ['status'],
    where: { status: ['ACTIVE', 'SUSPENDED'] },
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
/**
 * FLOW: The `down` function undoes the `up` function.
 * Since we are deleting the table entirely, Postgres automatically cleans up our indexes and constraints.
 */
  await queryInterface.dropTable('users');
}
