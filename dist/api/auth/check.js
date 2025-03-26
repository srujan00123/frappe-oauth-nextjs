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
exports.checkAuth = checkAuth;
const server_1 = require("next/server");
const session_1 = require("../../session");
/**
 * Check if the user is authenticated
 */
function checkAuth(request, config) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if the session is valid
        const isAuthenticated = (0, session_1.checkSession)(config);
        if (!isAuthenticated) {
            return server_1.NextResponse.json({ error: 'Unauthorized', authenticated: false }, { status: 401 });
        }
        return server_1.NextResponse.json({ authenticated: true }, { status: 200 });
    });
}
