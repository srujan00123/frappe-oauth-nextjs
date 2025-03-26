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
exports.login = login;
exports.logout = logout;
exports.checkAuth = checkAuth;
/**
 * Initiate a login flow
 *
 * @param loginUrl Login endpoint URL
 */
function login(loginUrl = '/api/auth/login') {
    window.location.href = loginUrl;
}
/**
 * Logout and clear session
 *
 * @param logoutUrl Logout endpoint URL
 * @param redirectUrl URL to redirect to after logout
 */
function logout() {
    return __awaiter(this, arguments, void 0, function* (logoutUrl = '/api/auth/logout', redirectUrl = '/') {
        try {
            yield fetch(logoutUrl, { method: 'POST' });
            window.location.href = redirectUrl;
        }
        catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    });
}
/**
 * Check if user is authenticated
 *
 * @param checkUrl Auth check endpoint URL
 * @returns Promise that resolves to authentication status and user info
 */
function checkAuth() {
    return __awaiter(this, arguments, void 0, function* (checkUrl = '/api/auth/check') {
        try {
            const response = yield fetch(checkUrl);
            const data = yield response.json();
            return {
                authenticated: data.authenticated,
                user: data.user || null,
                expiresAt: data.expires
            };
        }
        catch (error) {
            console.error('Auth check error:', error);
            return {
                authenticated: false,
                user: null
            };
        }
    });
}
// Export any auth utility function types explicitly 
