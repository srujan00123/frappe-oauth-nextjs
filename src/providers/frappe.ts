import type { FrappeProfile, FrappeProviderConfig, FrappeTokenResponse } from "../types";
import { generateRandomString, sha256 } from "../utils/crypto";

/**
 * Frappe OAuth provider for NextAuth.js
 * 
 * Implements OAuth 2.0 authorization code flow with PKCE and OpenID Connect
 * 
 * @param options Provider options
 * @returns NextAuth.js OAuth provider configuration
 * 
 * @example
 * ```js
 * import NextAuth from "next-auth";
 * import FrappeProvider from "frappe-next-auth";
 * 
 * export default NextAuth({
 *   providers: [
 *     FrappeProvider({
 *       clientId: process.env.FRAPPE_CLIENT_ID,
 *       clientSecret: process.env.FRAPPE_CLIENT_SECRET,
 *       serverUrl: process.env.FRAPPE_SERVER_URL,
 *     }),
 *   ],
 * });
 * ```
 */
export function FrappeProvider(options: FrappeProviderConfig): any {
    const { serverUrl } = options;

    // Strip trailing slash if it exists
    const baseUrl = serverUrl.endsWith("/")
        ? serverUrl.slice(0, -1)
        : serverUrl;

    return {
        id: "frappe",
        name: "Frappe",
        type: "oauth",

        // Specify the endpoints manually as Frappe's .well-known endpoint may not be available
        authorization: {
            url: `${baseUrl}/api/method/frappe.integrations.oauth2.authorize`,
            params: {
                scope: "openid all",
                response_type: "code",
                ...options.authorization?.params
            }
        },
        token: {
            url: `${baseUrl}/api/method/frappe.integrations.oauth2.get_token`,
            params: {
                grant_type: "authorization_code"
            }
        },
        userinfo: {
            url: `${baseUrl}/api/method/frappe.integrations.oauth2.openid_profile`,
            async request({ tokens, provider }: { tokens: { access_token: string }, provider: { userinfo?: { url: string } } }) {
                // Get user info from Frappe OpenID endpoint
                const response = await fetch(provider.userinfo?.url as string, {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`
                    }
                });

                if (!response.ok) {
                    throw new Error("Failed to fetch user information");
                }

                return await response.json();
            }
        },
        idToken: true,
        checks: ["pkce", "state"],

        // PKCE configuration
        async generateCodeVerifier() {
            // Generate a random string for PKCE code_verifier
            return generateRandomString(64);
        },

        async generateCodeChallenge(codeVerifier: string) {
            // Generate code_challenge from code_verifier using S256 method
            return await sha256(codeVerifier);
        },

        // Extract user profile from Frappe's OpenID profile
        profile(profile: FrappeProfile) {
            return {
                id: profile.sub,
                name: profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim(),
                email: profile.email,
                image: profile.picture,
                roles: profile.roles || [],
            };
        },

        // Use clientId and clientSecret from options
        clientId: options.clientId,
        clientSecret: options.clientSecret,

        // Store all options for later use
        options
    };
} 