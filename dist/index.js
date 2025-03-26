"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAuth = exports.AuthProvider = exports.AuthContext = exports.proxyToFrappeApi = exports.exchangeToken = exports.getServerInfo = exports.refreshToken = exports.logout = exports.checkAuth = exports.generateState = exports.generateCodeChallenge = exports.generateCodeVerifier = exports.checkSession = exports.clearSessionCookie = exports.setSessionCookie = exports.getSessionCookie = exports.createSession = exports.FrappeOAuthClient = void 0;
// Server-side utilities
var oauth_client_1 = require("./oauth-client");
Object.defineProperty(exports, "FrappeOAuthClient", { enumerable: true, get: function () { return oauth_client_1.FrappeOAuthClient; } });
var session_1 = require("./session");
Object.defineProperty(exports, "createSession", { enumerable: true, get: function () { return session_1.createSession; } });
Object.defineProperty(exports, "getSessionCookie", { enumerable: true, get: function () { return session_1.getSessionCookie; } });
Object.defineProperty(exports, "setSessionCookie", { enumerable: true, get: function () { return session_1.setSessionCookie; } });
Object.defineProperty(exports, "clearSessionCookie", { enumerable: true, get: function () { return session_1.clearSessionCookie; } });
Object.defineProperty(exports, "checkSession", { enumerable: true, get: function () { return session_1.checkSession; } });
var pkce_1 = require("./pkce");
Object.defineProperty(exports, "generateCodeVerifier", { enumerable: true, get: function () { return pkce_1.generateCodeVerifier; } });
Object.defineProperty(exports, "generateCodeChallenge", { enumerable: true, get: function () { return pkce_1.generateCodeChallenge; } });
Object.defineProperty(exports, "generateState", { enumerable: true, get: function () { return pkce_1.generateState; } });
// API routes
var check_1 = require("./api/auth/check");
Object.defineProperty(exports, "checkAuth", { enumerable: true, get: function () { return check_1.checkAuth; } });
var logout_1 = require("./api/auth/logout");
Object.defineProperty(exports, "logout", { enumerable: true, get: function () { return logout_1.logout; } });
var refresh_1 = require("./api/auth/refresh");
Object.defineProperty(exports, "refreshToken", { enumerable: true, get: function () { return refresh_1.refreshToken; } });
var server_1 = require("./api/auth/server");
Object.defineProperty(exports, "getServerInfo", { enumerable: true, get: function () { return server_1.getServerInfo; } });
var token_1 = require("./api/auth/token");
Object.defineProperty(exports, "exchangeToken", { enumerable: true, get: function () { return token_1.exchangeToken; } });
// Proxy utilities
var api_proxy_1 = require("./proxy/api-proxy");
Object.defineProperty(exports, "proxyToFrappeApi", { enumerable: true, get: function () { return api_proxy_1.proxyToFrappeApi; } });
// React components and hooks 
var client_1 = require("./client");
Object.defineProperty(exports, "AuthContext", { enumerable: true, get: function () { return client_1.AuthContext; } });
Object.defineProperty(exports, "AuthProvider", { enumerable: true, get: function () { return client_1.AuthProvider; } });
Object.defineProperty(exports, "useAuth", { enumerable: true, get: function () { return client_1.useAuth; } });
