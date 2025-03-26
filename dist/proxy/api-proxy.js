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
exports.proxyToFrappeApi = proxyToFrappeApi;
const server_1 = require("next/server");
const session_1 = require("../session");
/**
 * Proxy a request to the Frappe API
 */
function proxyToFrappeApi(request, apiPath, config) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if the session is valid
        const session = (0, session_1.getSessionCookie)(config);
        if (!session) {
            return server_1.NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        // Construct the full URL
        const url = new URL(apiPath, config.serverUrl);
        // Get the request body for POST, PUT, PATCH methods
        let body = null;
        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            try {
                body = yield request.json();
            }
            catch (error) {
                // If there's no JSON body, use the raw body
                body = yield request.text();
            }
        }
        // Forward the request to the Frappe API
        try {
            const response = yield fetch(url.toString(), {
                method: request.method,
                headers: {
                    'Content-Type': request.headers.get('Content-Type') || 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: body ? JSON.stringify(body) : undefined
            });
            // Read the response
            const responseData = yield response.json();
            // Return the response with appropriate status
            return server_1.NextResponse.json(responseData, {
                status: response.status
            });
        }
        catch (error) {
            console.error('Frappe API proxy error:', error);
            return server_1.NextResponse.json({ error: 'Failed to communicate with Frappe API' }, { status: 500 });
        }
    });
}
