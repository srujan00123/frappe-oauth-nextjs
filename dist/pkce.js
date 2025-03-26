"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePKCEPair = void 0;
exports.generateCodeVerifier = generateCodeVerifier;
exports.generateCodeChallenge = generateCodeChallenge;
exports.generateState = generateState;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generate both code verifier and code challenge
 */
const generatePKCEPair = (client, length = 43) => {
    const codeVerifier = client.generateCodeVerifier(length);
    const codeChallenge = client.generateCodeChallenge(codeVerifier);
    return {
        codeVerifier,
        codeChallenge,
        codeChallengeMethod: 'S256'
    };
};
exports.generatePKCEPair = generatePKCEPair;
/**
 * Generate a random code verifier for PKCE
 */
function generateCodeVerifier(length = 64) {
    return base64URLEncode(crypto_1.default.randomBytes(length));
}
/**
 * Generate a code challenge from a code verifier using SHA-256
 */
function generateCodeChallenge(codeVerifier) {
    const hash = crypto_1.default.createHash('sha256')
        .update(codeVerifier)
        .digest();
    return base64URLEncode(hash);
}
/**
 * Base64URL encode a buffer
 */
function base64URLEncode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
/**
 * Generate a random state parameter
 */
function generateState(length = 32) {
    return base64URLEncode(crypto_1.default.randomBytes(length));
}
