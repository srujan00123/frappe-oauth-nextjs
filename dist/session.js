"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getSessionCookie = getSessionCookie;
exports.setSessionCookie = setSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
exports.checkSession = checkSession;
const headers_1 = require("next/headers");
/**
 * Create a new session object from token response
 */
function createSession(tokenResponse) {
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
function getSessionCookie(config) {
    const cookieName = config.cookieName || 'frappe_oauth_session';
    const cookieStore = (0, headers_1.cookies)();
    const sessionCookie = cookieStore.get(cookieName);
    if (!(sessionCookie === null || sessionCookie === void 0 ? void 0 : sessionCookie.value)) {
        return null;
    }
    try {
        return JSON.parse(sessionCookie.value);
    }
    catch (error) {
        return null;
    }
}
/**
 * Set the session cookie
 */
function setSessionCookie(session, config) {
    const cookieName = config.cookieName || 'frappe_oauth_session';
    const cookieStore = (0, headers_1.cookies)();
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
function clearSessionCookie(config) {
    const cookieName = config.cookieName || 'frappe_oauth_session';
    const cookieStore = (0, headers_1.cookies)();
    cookieStore.delete(cookieName);
}
/**
 * Check if the current session is valid
 */
function checkSession(config) {
    const session = getSessionCookie(config);
    if (!session) {
        return false;
    }
    // Check if the session is expired (with 60s buffer)
    return session.expiresAt > Date.now() + 60000;
}
