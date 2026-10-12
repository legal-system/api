import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

// Concept details: .ai/auth/lesson-3-hashing.md

// Step 1: Scramble plain password with bcrypt before saving to DB
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.PASSWORD_HASH_ROUNDS);
}

// Step 2: Compare user input against stored hash for authentication
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
