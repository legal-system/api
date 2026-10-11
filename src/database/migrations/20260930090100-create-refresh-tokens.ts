import { DataTypes, QueryInterface } from 'sequelize';

/**
 * Creates the refresh_tokens table.
 *
 * Tokens are stored only as SHA-256 hashes, so this table can never be used to
 * impersonate a user, even by someone who gets a database backup.
 */
export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('refresh_tokens', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      // CASCADE, so deleting a user cannot leave dangling token rows.
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    token_hash: {
      // 64 hex characters is exactly one SHA-256 digest.
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    replaced_by_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'refresh_tokens', key: 'id' },
      // Restricting: the replacement token must be deleted first.
      onDelete: 'SET NULL',
    },
    user_agent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ip_address: {
      // 45 is the longest an IPv6 address can be in full form.
      type: DataTypes.STRING(45),
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

  // The lookup that happens on every single refresh request.
  await queryInterface.addIndex('refresh_tokens', {
    name: 'refresh_tokens_hash_unique',
    unique: true,
    fields: ['token_hash'],
  });

  await queryInterface.addIndex('refresh_tokens', {
    name: 'refresh_tokens_user_id_idx',
    fields: ['user_id'],
  });

  // Lets a scheduled cleanup job find expired rows without scanning the table.
  await queryInterface.addIndex('refresh_tokens', {
    name: 'refresh_tokens_expires_at_idx',
    fields: ['expires_at'],
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('refresh_tokens');
}
