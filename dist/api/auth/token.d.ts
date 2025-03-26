import { NextRequest, NextResponse } from 'next/server';
import { FrappeOAuthConfig } from '../../types';
/**
 * Exchange authorization code for tokens
 */
export declare function exchangeToken(request: NextRequest, config: FrappeOAuthConfig): Promise<NextResponse>;
