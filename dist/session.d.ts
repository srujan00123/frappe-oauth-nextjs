import { FrappeOAuthConfig, FrappeSession } from './types';
/**
 * Create a new session object from token response
 */
export declare function createSession(tokenResponse: any): FrappeSession;
/**
 * Get the session cookie
 */
export declare function getSessionCookie(config: FrappeOAuthConfig): FrappeSession | null;
/**
 * Set the session cookie
 */
export declare function setSessionCookie(session: FrappeSession, config: FrappeOAuthConfig): void;
/**
 * Clear the session cookie
 */
export declare function clearSessionCookie(config: FrappeOAuthConfig): void;
/**
 * Check if the current session is valid
 */
export declare function checkSession(config: FrappeOAuthConfig): boolean;
