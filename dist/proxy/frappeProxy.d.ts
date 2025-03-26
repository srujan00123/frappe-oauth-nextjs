import { NextApiRequest, NextApiResponse } from 'next';
import { FrappeOAuthConfig } from '../types';
interface ProxyOptions {
    baseUrl?: string;
    headers?: Record<string, string>;
    requireAuth?: boolean;
}
/**
 * Proxy a request to the Frappe API
 *
 * @param req Next.js API request
 * @param res Next.js API response
 * @param config Frappe OAuth configuration
 * @param path API path to proxy to
 * @param options Proxy options
 */
export declare function proxyToFrappeApi(req: NextApiRequest, res: NextApiResponse, config: FrappeOAuthConfig, path: string, options?: ProxyOptions): Promise<void>;
/**
 * Create a proxy handler with pre-configured options
 *
 * @param config Frappe OAuth configuration
 * @param defaultOptions Default proxy options
 * @returns Proxy handler function
 */
export declare function createFrappeApiProxy(config: FrappeOAuthConfig, defaultOptions?: ProxyOptions): (req: NextApiRequest, res: NextApiResponse, path: string, options?: ProxyOptions) => Promise<void>;
export {};
