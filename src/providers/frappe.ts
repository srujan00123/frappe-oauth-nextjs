import type { FrappeProfile, FrappeProviderConfig } from "../types";

/**
 * Frappe OAuth provider for NextAuth.js
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
        wellKnown: `${baseUrl}/.well-known/openid-configuration`,
        authorization: {
            params: {
                scope: "openid email profile",
                ...options.authorization?.params
            }
        },
        idToken: true,
        checks: ["pkce", "state"],
        profile(profile: FrappeProfile) {
            return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                roles: profile.roles || [],
            };
        },
        options
    };
} 