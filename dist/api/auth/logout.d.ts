import { NextRequest, NextResponse } from 'next/server';
import { FrappeOAuthConfig } from '../../types';
/**
 * Logout the user by revoking tokens and clearing the session
 */
export declare function logout(request: NextRequest, config: FrappeOAuthConfig): Promise<NextResponse>;
