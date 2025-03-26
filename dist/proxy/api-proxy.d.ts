import { NextRequest, NextResponse } from 'next/server';
import { FrappeOAuthConfig } from '../types';
/**
 * Proxy a request to the Frappe API
 */
export declare function proxyToFrappeApi(request: NextRequest, apiPath: string, config: FrappeOAuthConfig): Promise<NextResponse>;
