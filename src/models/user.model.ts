import { DataTypes, type Model } from 'sequelize';
import { sequelize } from '../config/database.js';

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// Attributes are camelCase in JavaScript; `underscored` maps them to the
// snake_case columns defined in the migrations. The two are deliberately
// different: the code speaks TypeScript, the database speaks SQL.
export interface UserAttributes {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// id, timestamps and deletedAt are filled in by Sequelize, so callers never
// pass them. The optional flags have database defaults behind them.
export interface UserCreationAttributes {
  fullName: string;
  email: string;
  passwordHash: string;
  status?: UserStatus;
  emailVerifiedAt?: Date | null;
  lastLoginAt?: Date | null;
  passwordChangedAt?: Date | null;
}

// Model<A, CA> tells Sequelize exactly which fields exist and which are
// optional, so `User.create()` and `user.get('fullName')` are fully typed.
export const User = sequelize.define<Model<UserAttributes, UserCreationAttributes>>(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      // The domain rule that no two accounts may share an address. Enforced by
      // a unique index in the migration, so it also applies to raw SQL.
      unique: true,
    },
    passwordHash: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Excluded by defaultScope below, so it never reaches a JSON response.
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: USER_STATUS.ACTIVE,
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Declared so the model type and the table agree. Sequelize still manages
    // their values: these get written on insert and update, and deletedAt is
    // only ever set by destroy().
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',

    // Soft deletes: rows are flagged, not removed. `paranoid` then filters
    // deleted users out of every query automatically, so a suspended account
    // cannot be found again just by looking harder. `deletedAt` defaults to the
    // column of the same name, mapped to `deleted_at` by `underscored`.
    paranoid: true,

    // Safe by default: JSON responses and normal queries cannot leak the hash.
    // Login must opt back in with User.unscoped() when it needs to verify it.
    defaultScope: {
      attributes: { exclude: ['passwordHash'] },
    },
  },
);
