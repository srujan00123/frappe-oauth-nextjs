import { parse, serialize } from 'cookie';
import { NextApiRequest, NextApiResponse } from 'next';
import {
    FrappeOAuthConfig,
    FrappeSession,
    GetSessionOptions
} from './types';
import { FrappeOAuthClient } from './oauth-client';

// Default cookie name
const DEFAULT_SESSION_COOKIE = 'frappe_session';

// Default secure cookie options
const DEFAULT_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
};

/**
 * Sets a session cookie
 */
export const setSessionCookie = (
    res: NextApiResponse,
    session: FrappeSession,
    config: FrappeOAuthConfig
): void => {
    const cookieName = config.cookieName || DEFAULT_SESSION_COOKIE;
    const cookieOptions = {
        ...DEFAULT_COOKIE_OPTIONS,
        ...config.cookieOptions,
    };

    res.setHeader('Set-Cookie', serialize(
        cookieName,
        JSON.stringify(session),
        cookieOptions
    ));
};

/**
 * Gets the session from cookies
 */
export const getSessionCookie = (
    req: NextApiRequest,
    config: FrappeOAuthConfig
): FrappeSession | null => {
    const cookieName = config.cookieName || DEFAULT_SESSION_COOKIE;
    const cookies = parse(req.headers.cookie || '');

    try {
        const sessionCookie = cookies[cookieName];
        if (!sessionCookie) return null;
        return JSON.parse(sessionCookie) as FrappeSession;
    } catch (error) {
        console.error('Error parsing session cookie:', error);
        return null;
    }
};

/**
 * Clears the session cookie
 */
export const clearSessionCookie = (
    res: NextApiResponse,
    config: FrappeOAuthConfig
): void => {
    const cookieName = config.cookieName || DEFAULT_SESSION_COOKIE;
    const cookieOptions = {
        ...DEFAULT_COOKIE_OPTIONS,
        ...config.cookieOptions,
        maxAge: 0,
    };

    res.setHeader('Set-Cookie', serialize(
        cookieName,
        '',
        cookieOptions
    ));
};

/**
 * Check if session is valid and refresh if needed
 */
export const checkSession = async (
    options: GetSessionOptions,
    config: FrappeOAuthConfig
): Promise<FrappeSession | null> => {
    const { req, res } = options;
    const session = getSessionCookie(req, config);

    if (!session) return null;

    // Check if token is expired or about to expire (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = session.expiresAt <= now;
    const isAboutToExpire = session.expiresAt <= now + 300; // 5 min buffer

    if (!isExpired && !isAboutToExpire) {
        return session;
    }

    // If token is expired or about to expire and we have refresh token, try to refresh
    if (session.tokenSet.refresh_token && res) {
        try {
            const oauthClient = new FrappeOAuthClient(config);
            const response = await oauthClient.refreshToken(session.tokenSet.refresh_token);

            const expiresAt = Math.floor(Date.now() / 1000) + response.expires_in;

            const newSession: FrappeSession = {
                tokenSet: {
                    access_token: response.access_token,
                    token_type: response.token_type,
                    refresh_token: response.refresh_token,
                    id_token: response.id_token,
                    expires_at: expiresAt
                },
                expiresAt,
                user: session.user
            };

            // Update the session cookie
            setSessionCookie(res, newSession, config);
            return newSession;
        } catch (error) {
            console.error('Error refreshing token:', error);
            clearSessionCookie(res, config);
            return null;
        }
    }

    // If no refresh token or no response object, clear the cookie if possible
    if (res) {
        clearSessionCookie(res, config);
    }

    return null;
};

/**
 * Create a new session from token response
 */
export const createSession = async (
    tokenResponse: {
        access_token: string;
        refresh_token: string;
        token_type: string;
        expires_in: number;
        id_token?: string;
    },
    getUserInfo: boolean,
    oauthClient: FrappeOAuthClient
): Promise<FrappeSession> => {
    const expiresAt = Math.floor(Date.now() / 1000) + tokenResponse.expires_in;

    const session: FrappeSession = {
        tokenSet: {
            access_token: tokenResponse.access_token,
            refresh_token: tokenResponse.refresh_token,
            token_type: tokenResponse.token_type,
            id_token: tokenResponse.id_token,
            expires_at: expiresAt
        },
        expiresAt
    };

    if (getUserInfo) {
        try {
            const userInfo = await oauthClient.getUserInfo(tokenResponse.access_token);
            session.user = userInfo;
        } catch (error) {
            console.error('Error fetching user info:', error);
            // Continue without user info
        }
    }

    return session;
}; 