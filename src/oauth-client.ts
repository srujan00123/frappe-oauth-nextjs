import { FrappeOAuthConfig, FrappeUserInfo, FrappeSession } from './types';
import crypto from 'crypto';

export class FrappeOAuthClient {
    private config: FrappeOAuthConfig;

    constructor(config: FrappeOAuthConfig) {
        this.config = config;
    }

    /**
     * Generate a code verifier for PKCE
     */
    public generateCodeVerifier(length = 43): string {
        const randomBytes = crypto.randomBytes(32);
        return randomBytes.toString('base64url').substring(0, length);
    }

    /**
     * Generate a code challenge for PKCE
     */
    public generateCodeChallenge(codeVerifier: string): string {
        // For S256, generate SHA256 hash and return base64url-encoded value
        const hash = crypto.createHash('sha256').update(codeVerifier).digest();
        return hash.toString('base64url');
    }

    /**
     * Generate a random state
     */
    public generateState(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Get the authorization URL for redirecting the user
     */
    getAuthorizationUrl(state: string, codeChallenge?: string): string {
        const url = new URL(this.getAuthorizationEndpoint());

        url.searchParams.append('response_type', 'code');
        url.searchParams.append('client_id', this.config.clientId);
        url.searchParams.append('redirect_uri', this.config.redirectUri);
        url.searchParams.append('state', state);

        if (this.config.scope) {
            url.searchParams.append('scope', this.config.scope);
        }

        if (codeChallenge) {
            url.searchParams.append('code_challenge', codeChallenge);
            url.searchParams.append('code_challenge_method', 'S256');
        }

        return url.toString();
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCodeForToken(code: string, codeVerifier?: string): Promise<any> {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', this.config.clientId);
        params.append('redirect_uri', this.config.redirectUri);
        params.append('code', code);

        if (codeVerifier) {
            params.append('code_verifier', codeVerifier);
        }

        const response = await fetch(this.getTokenEndpoint(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Refresh the access token using the refresh token
     */
    async refreshToken(refreshToken: string): Promise<any> {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('client_id', this.config.clientId);
        params.append('refresh_token', refreshToken);

        const response = await fetch(this.getTokenEndpoint(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Logout the user by revoking their tokens
     */
    async logout(session: FrappeSession): Promise<boolean> {
        try {
            // First try to revoke the access token
            await this.revokeToken(session.accessToken);

            // Then revoke the refresh token if available
            if (session.refreshToken) {
                await this.revokeToken(session.refreshToken);
            }

            return true;
        } catch (error) {
            console.error('Error during logout:', error);
            return false;
        }
    }

    /**
     * Revoke a token
     */
    private async revokeToken(token: string): Promise<void> {
        const params = new URLSearchParams();
        params.append('token', token);
        params.append('client_id', this.config.clientId);

        const url = this.getLogoutEndpoint();
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            console.warn(`Token revocation warning: ${response.statusText}`);
        }
    }

    /**
     * Get user information
     */
    async getUserInfo(accessToken: string): Promise<any> {
        const response = await fetch(this.getUserInfoEndpoint(), {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`User info request failed: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get the token endpoint URL
     */
    private getTokenEndpoint(): string {
        if (this.config.tokenEndpoint) {
            return this.config.tokenEndpoint;
        }
        return `${this.config.serverUrl}/oauth/token`;
    }

    /**
     * Get the authorization endpoint URL
     */
    private getAuthorizationEndpoint(): string {
        if (this.config.authorizationEndpoint) {
            return this.config.authorizationEndpoint;
        }
        return `${this.config.serverUrl}/oauth/authorize`;
    }

    /**
     * Get the logout endpoint URL
     */
    private getLogoutEndpoint(): string {
        if (this.config.logoutEndpoint) {
            return this.config.logoutEndpoint;
        }
        return `${this.config.serverUrl}/oauth/revoke_token`;
    }

    /**
     * Get the userinfo endpoint URL
     */
    private getUserInfoEndpoint(): string {
        if (this.config.userInfoEndpoint) {
            return this.config.userInfoEndpoint;
        }
        return `${this.config.serverUrl}/api/method/frappe.integrations.oauth2.openid_profile`;
    }

    /**
     * Introspect token to check if it's valid
     */
    async introspectToken(token: string): Promise<any> {
        const params = new URLSearchParams();
        params.append('token', token);
        params.append('client_id', this.config.clientId);

        const response = await fetch(`${this.config.serverUrl}/api/method/frappe.integrations.oauth2.introspect_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
        });

        if (!response.ok) {
            throw new Error(`Token introspection failed: ${response.statusText}`);
        }

        return response.json();
    }
} 