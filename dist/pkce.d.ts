import { FrappeOAuthClient } from './oauth-client';
/**
 * Generate both code verifier and code challenge
 */
export declare const generatePKCEPair: (client: FrappeOAuthClient, length?: number) => {
    codeVerifier: string;
    codeChallenge: string;
    codeChallengeMethod: "S256";
};
/**
 * Generate a random code verifier for PKCE
 */
export declare function generateCodeVerifier(length?: number): string;
/**
 * Generate a code challenge from a code verifier using SHA-256
 */
export declare function generateCodeChallenge(codeVerifier: string): string;
/**
 * Generate a random state parameter
 */
export declare function generateState(length?: number): string;
