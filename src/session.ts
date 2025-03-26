import { cookies } from 'next/headers';
import { FrappeOAuthConfig, FrappeSession } from './types';

/**
 * Create a new session object from token response
 */
export function createSession(tokenResponse: any): FrappeSession {
    return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: tokenResponse.expires_at || Date.now() + tokenResponse.expires_in * 1000,
        tokenType: tokenResponse.token_type,
        scope: tokenResponse.scope,
        idToken: tokenResponse.id_token
    };
}

/**
 * Get the session cookie
 */
export function getSessionCookie(config: FrappeOAuthConfig): FrappeSession | null {
    const cookieName = config.cookieName || 'frappe_oauth_session';
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(cookieName);

    if (!sessionCookie?.value) {
        return null;
    }

    try {
        return JSON.parse(sessionCookie.value) as FrappeSession;
    } catch (error) {
        return null;
    }
}

/**
 * Set the session cookie
 */
export function setSessionCookie(session: FrappeSession, config: FrappeOAuthConfig): void {
    const cookieName = config.cookieName || 'frappe_oauth_session';
    const cookieStore = cookies();

    cookieStore.set(cookieName, JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: Math.floor((session.expiresAt - Date.now()) / 1000)
    });
}

/**
 * Clear the session cookie
 */
export function clearSessionCookie(config: FrappeOAuthConfig): void {
    const cookieName = config.cookieName || 'frappe_oauth_session';
    const cookieStore = cookies();

    cookieStore.delete(cookieName);
}

/**
 * Check if the current session is valid
 */
export function checkSession(config: FrappeOAuthConfig): boolean {
    const session = getSessionCookie(config);

    if (!session) {
        return false;
    }

    // Check if the session is expired (with 60s buffer)
    return session.expiresAt > Date.now() + 60000;
} 