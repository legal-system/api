import { z } from 'zod';

// Concept details: .ai/auth/lesson-4-login.md
export const loginSchema = z.object({
  // trim/lowercase run before the email check, so " ADMIN@Foo.COM " still validates
  // and lands in the same shape as the accounts table (all stored lowercase).
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Email is required')
    .max(255, 'Email is too long')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
});

export type LoginInput = z.infer<typeof loginSchema>;
