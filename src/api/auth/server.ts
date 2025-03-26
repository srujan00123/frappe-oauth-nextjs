import { NextRequest, NextResponse } from 'next/server';
import { FrappeOAuthConfig } from '../../types';

/**
 * Get OAuth server information
 */
export async function getServerInfo(
    request: NextRequest,
    config: FrappeOAuthConfig
): Promise<NextResponse> {
    // Return basic server information
    return NextResponse.json({
        serverUrl: config.serverUrl,
        authorizationEndpoint: config.authorizationEndpoint || `${config.serverUrl}/oauth/authorize`,
        tokenEndpoint: config.tokenEndpoint || `${config.serverUrl}/oauth/token`,
        userInfoEndpoint: config.userInfoEndpoint || `${config.serverUrl}/api/method/frappe.integrations.oauth2.openid_profile`
    }, { status: 200 });
} 