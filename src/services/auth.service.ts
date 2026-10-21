import { User, USER_STATUS, type UserAttributes } from '../models/index.js';
import type { LoginInput } from '../schemas/auth.schema.js';
import { AppError } from '../utils/app-error.js';
import { signAccessToken } from '../utils/jwt.js';
import { verifyPassword } from '../utils/password.js';

// Concept details: .ai/auth/lesson-4-login.md

// A real bcrypt hash of a value nobody knows. Compared against when no account matches,
// so a missing email costs the same time as a wrong password.
const DUMMY_PASSWORD_HASH = '$2b$12$9GOizxjSkRj0i8Gti5f1d.nAgLi5H8rMHO7Owfkh5IWOhGMYbcbDO';

// Everything a client may see about a person, listed one by one so a future column can
// never leak into an API response by accident.
export type SafeUser = Pick<
  UserAttributes,
  'id' | 'fullName' | 'email' | 'status' | 'emailVerifiedAt' | 'lastLoginAt' | 'createdAt'
>;

export function toSafeUser(data: UserAttributes): SafeUser {
  return {
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    status: data.status,
    emailVerifiedAt: data.emailVerifiedAt,
    lastLoginAt: data.lastLoginAt,
    createdAt: data.createdAt,
  };
}

export async function login(
  input: LoginInput,
): Promise<{ user: SafeUser; accessToken: string }> {
  // Step 1: unscoped() is required — the default scope hides passwordHash, which is what we need.
  const user = await User.unscoped().findOne({ where: { email: input.email } });

  // Step 2: always spend one bcrypt comparison, even with no account, so response time
  // does not tell an attacker which emails are registered.
  const passwordMatches = await verifyPassword(
    input.password,
    user?.get().passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  }

  const data = user.get();

  // Step 3: after the password check, so being suspended is only revealed to someone who
  // already had the right password.
  if (data.status !== USER_STATUS.ACTIVE) {
    throw new AppError(403, 'ACCOUNT_SUSPENDED', 'This account is suspended');
  }

  // Step 4: record it for the audit trail; a failed update must not fail the login.
  try {
    await user.update({ lastLoginAt: new Date() });
  } catch {
    // losing last_login_at is cosmetic compared to blocking the sign-in
  }

  return {
    user: toSafeUser(user.get()),
    accessToken: signAccessToken({ sub: data.id, email: data.email }),
  };
}
