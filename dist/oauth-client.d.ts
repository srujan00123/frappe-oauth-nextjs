import { FrappeOAuthConfig, FrappeSession } from './types';
export declare class FrappeOAuthClient {
    private config;
    constructor(config: FrappeOAuthConfig);
    /**
     * Generate a code verifier for PKCE
     */
    generateCodeVerifier(length?: number): string;
    /**
     * Generate a code challenge for PKCE
     */
    generateCodeChallenge(codeVerifier: string): string;
    /**
     * Generate a random state
     */
    generateState(): string;
    /**
     * Get the authorization URL for redirecting the user
     */
    getAuthorizationUrl(state: string, codeChallenge?: string): string;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForToken(code: string, codeVerifier?: string): Promise<any>;
    /**
     * Refresh the access token using the refresh token
     */
    refreshToken(refreshToken: string): Promise<any>;
    /**
     * Logout the user by revoking their tokens
     */
    logout(session: FrappeSession): Promise<boolean>;
    /**
     * Revoke a token
     */
    private revokeToken;
    /**
     * Get user information
     */
    getUserInfo(accessToken: string): Promise<any>;
    /**
     * Get the token endpoint URL
     */
    private getTokenEndpoint;
    /**
     * Get the authorization endpoint URL
     */
    private getAuthorizationEndpoint;
    /**
     * Get the logout endpoint URL
     */
    private getLogoutEndpoint;
    /**
     * Get the userinfo endpoint URL
     */
    private getUserInfoEndpoint;
    /**
     * Introspect token to check if it's valid
     */
    introspectToken(token: string): Promise<any>;
}
