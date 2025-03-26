"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAuth = withAuth;
exports.createAuthMiddleware = createAuthMiddleware;
const session_1 = require("../session");
/**
 * Middleware to protect API routes that require authentication
 *
 * @param handler The API route handler to protect
 * @param config Frappe OAuth configuration
 * @returns Next.js API handler function
 */
function withAuth(handler, config) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Check and refresh the session if needed
            const session = yield (0, session_1.checkSession)({ req, res }, config);
            if (!session) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            // Call the handler with the verified session
            return handler(req, res, session);
        }
        catch (error) {
            console.error('Authentication middleware error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    });
}
/**
 * Middleware for Next.js App Router
 *
 * @param config Frappe OAuth configuration
 * @returns Middleware function
 */
function createAuthMiddleware(config) {
    return function authMiddleware(request) {
        return __awaiter(this, void 0, void 0, function* () {
            // Extract cookie header from the request
            const cookieHeader = request.headers.get('cookie') || '';
            // Create a mock NextApiRequest with the cookie header
            const mockReq = {
                headers: {
                    cookie: cookieHeader
                }
            };
            // Check session
            const session = yield (0, session_1.checkSession)({ req: mockReq }, config);
            if (!session) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                    status: 401,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            }
            return session;
        });
    };
}
