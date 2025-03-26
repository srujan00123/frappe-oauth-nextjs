import { NextRequest, NextResponse } from 'next/server';
import { checkSession } from '../../session';
import { FrappeOAuthConfig } from '../../types';

/**
 * Check if the user is authenticated
 */
export async function checkAuth(
    request: NextRequest,
    config: FrappeOAuthConfig
): Promise<NextResponse> {
    // Check if the session is valid
    const isAuthenticated = checkSession(config);

    if (!isAuthenticated) {
        return NextResponse.json(
            { error: 'Unauthorized', authenticated: false },
            { status: 401 }
        );
    }

    return NextResponse.json(
        { authenticated: true },
        { status: 200 }
    );
} 