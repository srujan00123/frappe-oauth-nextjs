import { FrappeOAuthConfig, FrappeUserInfo } from './types';
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
     * Generate authorization URL
     */
    public getAuthorizationUrl(
        options: {
            state?: string;
            codeVerifier?: string;
            codeChallenge?: string;
            scope?: string;
            responseType?: string;
        } = {}
    ): string {
        const scope = options.scope || this.config.scope || 'openid all';
        const responseType = options.responseType || 'code';

        const params = new URLSearchParams({
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope,
            response_type: responseType,
        });

        // Add PKCE parameters if enabled
        if (this.config.usePKCE !== false && options.codeVerifier) {
            const codeChallenge = options.codeChallenge || this.generateCodeChallenge(options.codeVerifier);
            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', 'S256');
        }

        // Add state parameter if provided
        if (options.state) {
            params.append('state', options.state);
        }

        return `${this.config.baseUrl}/api/method/frappe.integrations.oauth2.authorize?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    public async getToken(
        code: string,
        codeVerifier?: string
    ): Promise<any> {
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri
        });

        if (codeVerifier) {
            params.append('code_verifier', codeVerifier);
        }

        if (this.config.clientSecret) {
            params.append('client_secret', this.config.clientSecret);
        }

        const response = await fetch(`${this.config.baseUrl}/api/method/frappe.integrations.oauth2.get_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Token request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Refresh access token using refresh token
     */
    public async refreshToken(refreshToken: string): Promise<any> {
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.config.clientId
        });

        if (this.config.clientSecret) {
            params.append('client_secret', this.config.clientSecret);
        }

        const response = await fetch(`${this.config.baseUrl}/api/method/frappe.integrations.oauth2.get_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Revoke a token
     */
    public async revokeToken(token: string): Promise<void> {
        const params = new URLSearchParams({
            token
        });

        const response = await fetch(`${this.config.baseUrl}/api/method/frappe.integrations.oauth2.revoke_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Token revocation failed: ${response.status} ${response.statusText}`);
        }
    }

    /**
     * Get user info from OpenID endpoint
     */
    public async getUserInfo(accessToken: string): Promise<FrappeUserInfo> {
        const response = await fetch(`${this.config.baseUrl}/api/method/frappe.integrations.oauth2.openid_profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            throw new Error(`User info request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Introspect a token to check its validity and get information
     */
    public async introspectToken(
        token: string,
        tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
    ): Promise<any> {
        const params = new URLSearchParams({
            token,
            token_type_hint: tokenTypeHint
        });

        const response = await fetch(`${this.config.baseUrl}/api/method/frappe.integrations.oauth2.introspect_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            throw new Error(`Token introspection failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }
} 