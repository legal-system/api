import { createHash, randomBytes } from 'node:crypto';

// Concept details: .ai/auth/lesson-3-hashing.md

// 32 random bytes (256 bits) produces an unguessable token
const TOKEN_BYTES = 32;

// Step 1: Generate a URL-safe random string for the refresh token
export function generateRefreshToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

// Step 2: Hash token with SHA-256 before storing or looking up in DB
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
