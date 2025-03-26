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
exports.refreshToken = refreshToken;
const server_1 = require("next/server");
const session_1 = require("../../session");
const oauth_client_1 = require("../../oauth-client");
/**
 * Refresh the access token using the refresh token
 */
function refreshToken(request, config) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get the current session
        const session = (0, session_1.getSessionCookie)(config);
        if (!session || !session.refreshToken) {
            return server_1.NextResponse.json({ error: 'No valid session found' }, { status: 401 });
        }
        try {
            // Create OAuth client
            const client = new oauth_client_1.FrappeOAuthClient(config);
            // Refresh the token
            const tokenResponse = yield client.refreshToken(session.refreshToken);
            // Update the session with new tokens
            const updatedSession = Object.assign(Object.assign(Object.assign(Object.assign({}, session), { accessToken: tokenResponse.access_token, tokenType: tokenResponse.token_type, expiresAt: Date.now() + tokenResponse.expires_in * 1000 }), (tokenResponse.refresh_token && { refreshToken: tokenResponse.refresh_token })), (tokenResponse.id_token && { idToken: tokenResponse.id_token }));
            // Store the updated session
            (0, session_1.setSessionCookie)(updatedSession, config);
            return server_1.NextResponse.json({ success: true }, { status: 200 });
        }
        catch (error) {
            console.error('Token refresh error:', error);
            return server_1.NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
        }
    });
}
