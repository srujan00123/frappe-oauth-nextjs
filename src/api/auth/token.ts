import { NextRequest, NextResponse } from 'next/server';
import { createSession, setSessionCookie } from '../../session';
import { FrappeOAuthClient } from '../../oauth-client';
import { FrappeOAuthConfig } from '../../types';

/**
 * Exchange authorization code for tokens
 */
export async function exchangeToken(
    request: NextRequest,
    config: FrappeOAuthConfig
): Promise<NextResponse> {
    const requestData = await request.json();
    const { code, codeVerifier } = requestData;

    if (!code) {
        return NextResponse.json(
            { error: 'Authorization code is required' },
            { status: 400 }
        );
    }

    try {
        // Create OAuth client
        const client = new FrappeOAuthClient(config);

        // Exchange code for token
        const tokenResponse = await client.exchangeCodeForToken(code, codeVerifier);

        // Create and store session
        const session = createSession(tokenResponse);
        setSessionCookie(session, config);

        return NextResponse.json(
            { success: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Token exchange error:', error);

        return NextResponse.json(
            { error: 'Failed to exchange token' },
            { status: 500 }
        );
    }
} 