import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie, setSessionCookie } from '../../session';
import { FrappeOAuthClient } from '../../oauth-client';
import { FrappeOAuthConfig } from '../../types';

/**
 * Refresh the access token using the refresh token
 */
export async function refreshToken(
    request: NextRequest,
    config: FrappeOAuthConfig
): Promise<NextResponse> {
    // Get the current session
    const session = getSessionCookie(config);

    if (!session || !session.refreshToken) {
        return NextResponse.json(
            { error: 'No valid session found' },
            { status: 401 }
        );
    }

    try {
        // Create OAuth client
        const client = new FrappeOAuthClient(config);

        // Refresh the token
        const tokenResponse = await client.refreshToken(session.refreshToken);

        // Update the session with new tokens
        const updatedSession = {
            ...session,
            accessToken: tokenResponse.access_token,
            tokenType: tokenResponse.token_type,
            expiresAt: Date.now() + tokenResponse.expires_in * 1000,
            ...(tokenResponse.refresh_token && { refreshToken: tokenResponse.refresh_token }),
            ...(tokenResponse.id_token && { idToken: tokenResponse.id_token })
        };

        // Store the updated session
        setSessionCookie(updatedSession, config);

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Token refresh error:', error);

        return NextResponse.json(
            { error: 'Failed to refresh token' },
            { status: 500 }
        );
    }
} 