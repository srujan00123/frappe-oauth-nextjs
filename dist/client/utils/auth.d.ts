/**
 * Initiate a login flow
 *
 * @param loginUrl Login endpoint URL
 */
export declare function login(loginUrl?: string): void;
/**
 * Logout and clear session
 *
 * @param logoutUrl Logout endpoint URL
 * @param redirectUrl URL to redirect to after logout
 */
export declare function logout(logoutUrl?: string, redirectUrl?: string): Promise<void>;
/**
 * Check if user is authenticated
 *
 * @param checkUrl Auth check endpoint URL
 * @returns Promise that resolves to authentication status and user info
 */
export declare function checkAuth(checkUrl?: string): Promise<{
    authenticated: boolean;
    user: any | null;
    expiresAt?: number;
}>;
