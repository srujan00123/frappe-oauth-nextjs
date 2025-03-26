import { CookieSerializeOptions } from 'cookie';
import { JwtPayload } from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import type { UserInfoResponse } from 'openid-client';

export interface FrappeOAuthConfig {
    baseUrl: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    scope?: string;
    cookieName?: string;
    cookieOptions?: CookieSerializeOptions;
    usePKCE?: boolean;
}

export interface AuthorizationRequestOptions {
    responseType?: string;
    scope?: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: 'plain' | 's256';
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

export interface FrappeUserInfo extends UserInfoResponse {
    sub: string;
    name: string;
    given_name?: string;
    family_name?: string;
    iss: string;
    picture?: string;
    email?: string;
    iat: number;
    exp: number;
    aud: string;
    roles: string[];
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
    tokenSet: {
        access_token: string;
        token_type: string;
        id_token?: string;
        refresh_token?: string;
        expires_at?: number;
    };
    expiresAt: number;
    user?: FrappeUserInfo;
}

export interface GetSessionOptions {
    req: NextApiRequest;
    res?: NextApiResponse;
}

export interface RevokeTokenOptions {
    token: string;
} 