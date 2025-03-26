import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, getSessionCookie } from '../../session';
import { FrappeOAuthClient } from '../../oauth-client';
import { FrappeOAuthConfig } from '../../types';

/**
 * Logout the user by revoking tokens and clearing the session
 */
export async function logout(
    request: NextRequest,
    config: FrappeOAuthConfig
): Promise<NextResponse> {
    // Get the current session
    const session = getSessionCookie(config);

    if (session) {
        // Create OAuth client
        const client = new FrappeOAuthClient(config);

        // Try to revoke tokens
        await client.logout(session);
    }

    // Clear the session cookie regardless of revocation result
    clearSessionCookie(config);

    return NextResponse.json(
        { success: true },
        { status: 200 }
    );
} 