import { NextApiRequest, NextApiResponse } from 'next';
import { FrappeOAuthConfig } from '../types';
/**
 * Middleware to protect API routes that require authentication
 *
 * @param handler The API route handler to protect
 * @param config Frappe OAuth configuration
 * @returns Next.js API handler function
 */
export declare function withAuth(handler: (req: NextApiRequest, res: NextApiResponse, session: any) => Promise<void>, config: FrappeOAuthConfig): (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
/**
 * Middleware for Next.js App Router
 *
 * @param config Frappe OAuth configuration
 * @returns Middleware function
 */
export declare function createAuthMiddleware(config: FrappeOAuthConfig): (request: Request) => Promise<true | Response>;
