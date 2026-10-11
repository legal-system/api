import { DataTypes, type Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export interface RefreshTokenAttributes {
  id: string;
  userId: string;
  // SHA-256 of the issued token. The token itself is never stored, so a leaked
  // database dump cannot be replayed. See .ai/auth/lessons.md.
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  // Set when a token is rotated, pointing at the token that replaced it. This
  // is what lets reuse of an already-rotated token be traced to one session.
  replacedById: string | null;
  userAgent: string | null;
  // 45 characters: the longest an IPv6 address can be in full form.
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenCreationAttributes {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedById?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export const RefreshToken = sequelize.define<
  Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
>(
  'RefreshToken',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenHash: {
      // Exactly 64 hex characters: one SHA-256 digest.
      type: DataTypes.STRING(64),
      allowNull: false,
      // A second row with the same hash would break the lookup that proves a
      // token is real, and only a database bug could ever produce one.
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    replacedById: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },

    // Declared so the model type and the table agree; Sequelize manages them.
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'refresh_tokens',

    // No paranoid here on purpose. Revoking sets `revokedAt`, and the audit
    // trail needs expired and revoked rows to stay queryable.
    paranoid: false,
  },
);
