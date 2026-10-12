import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Utility: "Access Tokens"
 *
 * WHY: After login the server must recognise the user on every later request without
 * querying the database each time. An access token is a small signed string that
 * proves who the user is.
 *
 * FLOW:
 * 1. Login: build the claims (user id, email), sign them, return the token.
 * 2. Later requests: verify the signature and the expiry, then trust the claims.
 *
 * WHY signed and not encrypted: a JWT can be READ by anyone (it is just base64 text,
 * not a secret). The signature only proves nobody changed it. So never put a password
 * or anything private inside the payload.
 */

// Written into every token and checked on every verify, so a token minted for a
// different service or purpose cannot be replayed here.
export const ACCESS_TOKEN_ISSUER = 'legal-sys-api';
export const ACCESS_TOKEN_AUDIENCE = 'legal-sys-client';

export interface AccessTokenClaims {
  // `sub` ("subject") is the user id. The short name is part of the JWT standard.
  sub: string;
  email: string;
  // Marks this as an access token, so it can never be confused with another kind
  // of token we might add later.
  tokenType: 'access';
}

/**
 * FLOW: Wrap the claims in a token, add the expiry and the issuer, and sign it with
 * the secret. The signature is what makes the token impossible to forge or edit.
 */
export function signAccessToken(claims: Omit<AccessTokenClaims, 'tokenType'>): string {
  return jwt.sign({ ...claims, tokenType: 'access' }, env.JWT_ACCESS_SECRET, {
    // The jwt library insists on its own duration format, and env already rejected
    // anything it cannot understand (see durationString in config/env.ts).
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: ACCESS_TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
    // HS256 is a shared secret: the same key signs and verifies. That is correct for
    // one server signing its own tokens. A public/private key pair (RS256) would only
    // be needed if a separate service had to verify without being able to sign.
    algorithm: 'HS256',
  });
}

/**
 * FLOW: Check the signature, the expiry, the issuer and the audience, then hand back
 * the claims.
 *
 * WHY it throws instead of returning null: a missing or invalid token is not normal,
 * it means the request is not authenticated. Throwing forces the caller to decide the
 * response, so it cannot be forgotten.
 *
 * WHAT BREAKS IT: an expired token (TokenExpiredError), a token signed with a
 * different secret, or a token for another issuer/audience. All are caught by the
 * caller and turned into a 401.
 */
export function verifyAccessToken(token: string): AccessTokenClaims {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: ACCESS_TOKEN_ISSUER,
    audience: ACCESS_TOKEN_AUDIENCE,
    // Pinning the algorithm stops a forged token from claiming "alg: none" or
    // swapping to a weaker one.
    algorithms: ['HS256'],
  });

  if (typeof decoded === 'string' || !isAccessTokenClaims(decoded)) {
    throw new jwt.JsonWebTokenError('Malformed access token');
  }

  return decoded;
}

// A valid signature only proves the payload is untampered, not that it has the
// shape we expect, so the fields are checked before the claims are trusted.
function isAccessTokenClaims(payload: JwtPayload): payload is JwtPayload & AccessTokenClaims {
  return (
    typeof payload.sub === 'string' &&
    typeof payload.email === 'string' &&
    payload.tokenType === 'access'
  );
}
