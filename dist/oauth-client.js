"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrappeOAuthClient = void 0;
const crypto_1 = __importDefault(require("crypto"));
class FrappeOAuthClient {
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate a code verifier for PKCE
     */
    generateCodeVerifier(length = 43) {
        const randomBytes = crypto_1.default.randomBytes(32);
        return randomBytes.toString('base64url').substring(0, length);
    }
    /**
     * Generate a code challenge for PKCE
     */
    generateCodeChallenge(codeVerifier) {
        // For S256, generate SHA256 hash and return base64url-encoded value
        const hash = crypto_1.default.createHash('sha256').update(codeVerifier).digest();
        return hash.toString('base64url');
    }
    /**
     * Generate a random state
     */
    generateState() {
        return crypto_1.default.randomBytes(16).toString('hex');
    }
    /**
     * Get the authorization URL for redirecting the user
     */
    getAuthorizationUrl(state, codeChallenge) {
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
    exchangeCodeForToken(code, codeVerifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('client_id', this.config.clientId);
            params.append('redirect_uri', this.config.redirectUri);
            params.append('code', code);
            if (codeVerifier) {
                params.append('code_verifier', codeVerifier);
            }
            const response = yield fetch(this.getTokenEndpoint(), {
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
        });
    }
    /**
     * Refresh the access token using the refresh token
     */
    refreshToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            params.append('grant_type', 'refresh_token');
            params.append('client_id', this.config.clientId);
            params.append('refresh_token', refreshToken);
            const response = yield fetch(this.getTokenEndpoint(), {
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
        });
    }
    /**
     * Logout the user by revoking their tokens
     */
    logout(session) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // First try to revoke the access token
                yield this.revokeToken(session.accessToken);
                // Then revoke the refresh token if available
                if (session.refreshToken) {
                    yield this.revokeToken(session.refreshToken);
                }
                return true;
            }
            catch (error) {
                console.error('Error during logout:', error);
                return false;
            }
        });
    }
    /**
     * Revoke a token
     */
    revokeToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            params.append('token', token);
            params.append('client_id', this.config.clientId);
            const url = this.getLogoutEndpoint();
            const response = yield fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params,
            });
            if (!response.ok) {
                console.warn(`Token revocation warning: ${response.statusText}`);
            }
        });
    }
    /**
     * Get user information
     */
    getUserInfo(accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(this.getUserInfoEndpoint(), {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`User info request failed: ${response.statusText}`);
            }
            return response.json();
        });
    }
    /**
     * Get the token endpoint URL
     */
    getTokenEndpoint() {
        if (this.config.tokenEndpoint) {
            return this.config.tokenEndpoint;
        }
        return `${this.config.serverUrl}/oauth/token`;
    }
    /**
     * Get the authorization endpoint URL
     */
    getAuthorizationEndpoint() {
        if (this.config.authorizationEndpoint) {
            return this.config.authorizationEndpoint;
        }
        return `${this.config.serverUrl}/oauth/authorize`;
    }
    /**
     * Get the logout endpoint URL
     */
    getLogoutEndpoint() {
        if (this.config.logoutEndpoint) {
            return this.config.logoutEndpoint;
        }
        return `${this.config.serverUrl}/oauth/revoke_token`;
    }
    /**
     * Get the userinfo endpoint URL
     */
    getUserInfoEndpoint() {
        if (this.config.userInfoEndpoint) {
            return this.config.userInfoEndpoint;
        }
        return `${this.config.serverUrl}/api/method/frappe.integrations.oauth2.openid_profile`;
    }
    /**
     * Introspect token to check if it's valid
     */
    introspectToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const params = new URLSearchParams();
            params.append('token', token);
            params.append('client_id', this.config.clientId);
            const response = yield fetch(`${this.config.serverUrl}/api/method/frappe.integrations.oauth2.introspect_token`, {
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
        });
    }
}
exports.FrappeOAuthClient = FrappeOAuthClient;
