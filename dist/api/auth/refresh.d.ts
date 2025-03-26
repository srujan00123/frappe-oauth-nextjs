import { NextRequest, NextResponse } from 'next/server';
import { FrappeOAuthConfig } from '../../types';
/**
 * Refresh the access token using the refresh token
 */
export declare function refreshToken(request: NextRequest, config: FrappeOAuthConfig): Promise<NextResponse>;
