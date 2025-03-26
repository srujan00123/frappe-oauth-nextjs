import crypto from 'crypto';
import { FrappeOAuthClient } from './oauth-client';

/**
 * Generate both code verifier and code challenge
 */
export const generatePKCEPair = (
    client: FrappeOAuthClient,
    length = 43
): { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' } => {
    const codeVerifier = client.generateCodeVerifier(length);
    const codeChallenge = client.generateCodeChallenge(codeVerifier);

    return {
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256'
    };
};

/**
 * Generate a random code verifier for PKCE
 */
export function generateCodeVerifier(length = 64): string {
    return base64URLEncode(crypto.randomBytes(length));
}

/**
 * Generate a code challenge from a code verifier using SHA-256
 */
export function generateCodeChallenge(codeVerifier: string): string {
    const hash = crypto.createHash('sha256')
        .update(codeVerifier)
        .digest();

    return base64URLEncode(hash);
}

/**
 * Base64URL encode a buffer
 */
function base64URLEncode(buffer: Buffer): string {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Generate a random state parameter
 */
export function generateState(length = 32): string {
    return base64URLEncode(crypto.randomBytes(length));
} 