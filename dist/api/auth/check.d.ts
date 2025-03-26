import { NextRequest, NextResponse } from 'next/server';
import { FrappeOAuthConfig } from '../../types';
/**
 * Check if the user is authenticated
 */
export declare function checkAuth(request: NextRequest, config: FrappeOAuthConfig): Promise<NextResponse>;
