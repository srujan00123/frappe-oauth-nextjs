/**
 * Utility functions for cryptographic operations used in OAuth PKCE flow
 */

/**
 * Generates a random string of specified length
 * Used for code_verifier in PKCE flow
 * 
 * @param length Length of the string to generate
 * @returns Random string
 */
export function generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';

    // Use crypto.getRandomValues if available (browser)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const randomValues = new Uint8Array(length);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            result += charset[randomValues[i] % charset.length];
        }
    } else {
        // Fallback for Node.js or older browsers
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length));
        }
    }

    return result;
}

/**
 * Computes SHA-256 hash of a string and returns base64url encoded result
 * Used for code_challenge in PKCE flow with S256 method
 * 
 * @param input String to hash
 * @returns Base64url encoded SHA-256 hash
 */
export async function sha256(input: string): Promise<string> {
    // Use SubtleCrypto for browser environments
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return base64UrlEncode(hashBuffer);
    }

    // Fallback for Node.js
    try {
        // Try to use Node.js crypto module
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(input).digest();
        return base64UrlEncode(hash);
    } catch (error) {
        throw new Error('SHA-256 hashing is not available in this environment');
    }
}

/**
 * Encodes an ArrayBuffer or Buffer to base64url
 * 
 * @param buffer ArrayBuffer or Buffer to encode
 * @returns Base64url encoded string
 */
function base64UrlEncode(buffer: ArrayBuffer | Buffer): string {
    // Convert ArrayBuffer to Buffer if needed
    const bytes = buffer instanceof ArrayBuffer
        ? new Uint8Array(buffer)
        : buffer;

    // Convert to base64
    let base64;

    if (typeof Buffer !== 'undefined') {
        // Node.js environment
        base64 = Buffer.from(bytes).toString('base64');
    } else {
        // Browser environment
        const binary = Array.from(new Uint8Array(bytes))
            .map(byte => String.fromCharCode(byte))
            .join('');
        base64 = btoa(binary);
    }

    // Convert base64 to base64url by replacing characters
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
} 