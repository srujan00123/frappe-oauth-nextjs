import { NextRequest, NextResponse } from 'next/server';
import { FrappeOAuthConfig } from '../../types';
/**
 * Get OAuth server information
 */
export declare function getServerInfo(request: NextRequest, config: FrappeOAuthConfig): Promise<NextResponse>;
