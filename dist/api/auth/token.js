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
exports.exchangeToken = exchangeToken;
const server_1 = require("next/server");
const session_1 = require("../../session");
const oauth_client_1 = require("../../oauth-client");
/**
 * Exchange authorization code for tokens
 */
function exchangeToken(request, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const requestData = yield request.json();
        const { code, codeVerifier } = requestData;
        if (!code) {
            return server_1.NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
        }
        try {
            // Create OAuth client
            const client = new oauth_client_1.FrappeOAuthClient(config);
            // Exchange code for token
            const tokenResponse = yield client.exchangeCodeForToken(code, codeVerifier);
            // Create and store session
            const session = (0, session_1.createSession)(tokenResponse);
            (0, session_1.setSessionCookie)(session, config);
            return server_1.NextResponse.json({ success: true }, { status: 200 });
        }
        catch (error) {
            console.error('Token exchange error:', error);
            return server_1.NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
        }
    });
}
