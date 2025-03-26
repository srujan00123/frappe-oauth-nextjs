/**
 * Initiate a login flow
 * 
 * @param loginUrl Login endpoint URL
 */
export function login(loginUrl = '/api/auth/login'): void {
    window.location.href = loginUrl;
}

/**
 * Logout and clear session
 * 
 * @param logoutUrl Logout endpoint URL
 * @param redirectUrl URL to redirect to after logout
 */
export async function logout(
    logoutUrl = '/api/auth/logout',
    redirectUrl = '/'
): Promise<void> {
    try {
        await fetch(logoutUrl, { method: 'POST' });
        window.location.href = redirectUrl;
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

/**
 * Check if user is authenticated
 * 
 * @param checkUrl Auth check endpoint URL
 * @returns Promise that resolves to authentication status and user info
 */
export async function checkAuth(checkUrl = '/api/auth/check'): Promise<{
    authenticated: boolean;
    user: any | null;
    expiresAt?: number;
}> {
    try {
        const response = await fetch(checkUrl);
        const data = await response.json();

        return {
            authenticated: data.authenticated,
            user: data.user || null,
            expiresAt: data.expires
        };
    } catch (error) {
        console.error('Auth check error:', error);
        return {
            authenticated: false,
            user: null
        };
    }
} 