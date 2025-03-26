import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '../session';
import { FrappeOAuthConfig } from '../types';

/**
 * Proxy a request to the Frappe API
 */
export async function proxyToFrappeApi(
    request: NextRequest,
    apiPath: string,
    config: FrappeOAuthConfig
): Promise<NextResponse> {
    // Check if the session is valid
    const session = getSessionCookie(config);

    if (!session) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    // Construct the full URL
    const url = new URL(apiPath, config.serverUrl);

    // Get the request body for POST, PUT, PATCH methods
    let body: any = null;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
            body = await request.json();
        } catch (error) {
            // If there's no JSON body, use the raw body
            body = await request.text();
        }
    }

    // Forward the request to the Frappe API
    try {
        const response = await fetch(url.toString(), {
            method: request.method,
            headers: {
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
                'Authorization': `Bearer ${session.accessToken}`
            },
            body: body ? JSON.stringify(body) : undefined
        });

        // Read the response
        const responseData = await response.json();

        // Return the response with appropriate status
        return NextResponse.json(responseData, {
            status: response.status
        });
    } catch (error) {
        console.error('Frappe API proxy error:', error);

        return NextResponse.json(
            { error: 'Failed to communicate with Frappe API' },
            { status: 500 }
        );
    }
} 