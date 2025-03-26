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