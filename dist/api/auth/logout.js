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
exports.logout = logout;
const server_1 = require("next/server");
const session_1 = require("../../session");
const oauth_client_1 = require("../../oauth-client");
/**
 * Logout the user by revoking tokens and clearing the session
 */
function logout(request, config) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get the current session
        const session = (0, session_1.getSessionCookie)(config);
        if (session) {
            // Create OAuth client
            const client = new oauth_client_1.FrappeOAuthClient(config);
            // Try to revoke tokens
            yield client.logout(session);
        }
        // Clear the session cookie regardless of revocation result
        (0, session_1.clearSessionCookie)(config);
        return server_1.NextResponse.json({ success: true }, { status: 200 });
    });
}
