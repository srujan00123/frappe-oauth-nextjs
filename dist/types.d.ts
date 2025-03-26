import { JwtPayload } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
export interface FrappeOAuthConfig {
    clientId: string;
    serverUrl: string;
    redirectUri: string;
    scope?: string;
    tokenEndpoint?: string;
    authorizationEndpoint?: string;
    logoutEndpoint?: string;
    userInfoEndpoint?: string;
    cookieName?: string;
}
export interface AuthorizationRequestOptions {
    responseType?: string;
    scope?: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: 'plain' | 'S256';
}
export interface TokenRequestOptions {
    code: string;
    grantType?: string;
    codeVerifier?: string;
}
export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    id_token?: string;
}
export interface RefreshTokenOptions {
    refreshToken: string;
    scope?: string;
}
export interface FrappeUserInfo {
    sub: string;
    name?: string;
    email?: string;
    [key: string]: any;
}
export interface TokenIntrospectionResponse {
    client_id: string;
    trusted_client: number;
    active: boolean;
    exp: number;
    scope: string;
    sub: string;
    name: string;
    given_name?: string;
    family_name?: string;
    iss: string;
    picture?: string;
    email?: string;
    iat: number;
    aud: string;
    roles: string[];
}
export interface FrappeIdTokenPayload extends JwtPayload {
    sub: string;
    name: string;
    email?: string;
    roles: string[];
    nonce?: string;
    iss: string;
}
export interface FrappeSession {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    tokenType: string;
    scope?: string;
    idToken?: string;
}
export interface GetSessionOptions {
    req: NextApiRequest;
    res?: NextApiResponse;
}
export interface RevokeTokenOptions {
    token: string;
}
export interface FrappeAuthError {
    message: string;
    status?: number;
    code?: string;
}
