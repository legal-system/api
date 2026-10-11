// Associations live here so the model files stay independent of each other.
// No import cycles: this file imports both models, and neither imports this.
import { RefreshToken } from './refresh-token.model.js';
import { User } from './user.model.js';

// `userId` is the model attribute; `underscored` maps it to the `user_id`
// column created in the migration.
User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  // Mirrors the ON DELETE CASCADE in the migration, so a model created through
  // sync() would match. It does not alter an existing table.
  onDelete: 'CASCADE',
});

RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// Self-reference: replacedById points at another row in this same table.
RefreshToken.belongsTo(RefreshToken, {
  foreignKey: 'replacedById',
  as: 'replacedBy',
});

export { User, RefreshToken };
export type { UserAttributes, UserCreationAttributes, UserStatus } from './user.model.js';
export { USER_STATUS } from './user.model.js';
export type {
  RefreshTokenAttributes,
  RefreshTokenCreationAttributes,
} from './refresh-token.model.js';
