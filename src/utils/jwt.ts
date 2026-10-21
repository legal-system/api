import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

// Concept details: .ai/auth/lesson-4-jwt.md

// Fixed identifiers for this application to prevent cross-service token reuse
export const ACCESS_TOKEN_ISSUER = 'legal-sys-api';
export const ACCESS_TOKEN_AUDIENCE = 'legal-sys-client';

export interface AccessTokenClaims {
  sub: string; // User ID (standard JWT 'subject')
  email: string;
  tokenType: 'access';
}

// Step 1: Wrap user data into a signed, short-lived JWT access token
export function signAccessToken(claims: Omit<AccessTokenClaims, 'tokenType'>): string {
  return jwt.sign({ ...claims, tokenType: 'access' }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: ACCESS_TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
    algorithm: 'HS256',
  });
}

// Step 2: Validate token signature, expiration, and payload structure
export function verifyAccessToken(token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: ACCESS_TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
    algorithms: ['HS256'],
  });

  // Step 3: Ensure decoded token matches expected schema before trusting it
  if (typeof decoded === 'string' || !isAccessTokenClaims(decoded)) {
    throw new jwt.JsonWebTokenError('Malformed access token');
  }

  return decoded;
}

// Helper: Type guard verifying the payload has required user fields
function isAccessTokenClaims(payload: JwtPayload): payload is JwtPayload & AccessTokenClaims {
  return (
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string' &&
    payload.tokenType === 'access'
  );
}
