// Types - export all types explicitly
export {
    FrappeOAuthConfig,
    AuthorizationRequestOptions,
    TokenRequestOptions,
    TokenResponse,
    RefreshTokenOptions,
    FrappeUserInfo,
    TokenIntrospectionResponse,
    FrappeIdTokenPayload,
    FrappeSession,
    RevokeTokenOptions,
    FrappeAuthError
} from './types';

// Server-side utilities
export { FrappeOAuthClient } from './oauth-client';
export {
    createSession,
    getSessionCookie,
    setSessionCookie,
    clearSessionCookie,
    checkSession
} from './session';
export { generateCodeVerifier, generateCodeChallenge, generateState } from './pkce';

// API routes
export { checkAuth } from './api/auth/check';
export { logout } from './api/auth/logout';
export { refreshToken } from './api/auth/refresh';
export { getServerInfo } from './api/auth/server';
export { exchangeToken } from './api/auth/token';

// Proxy utilities
export { proxyToFrappeApi } from './proxy/api-proxy';

// React components and hooks 
export {
    AuthContext,
    AuthContextType,
    AuthProvider,
    useAuth
} from './client'; 