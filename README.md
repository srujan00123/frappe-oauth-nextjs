# frappe-oauth-nextjs

A comprehensive OAuth client for Frappe/ERPNext designed specifically for Next.js applications with server-side secure cookie storage.

## Features

- Complete OAuth 2.0 implementation for Frappe/ERPNext
- Support for OpenID Connect with ID token validation
- PKCE (Proof Key for Code Exchange) support for enhanced security
- Server-side secure cookie storage of authentication tokens
- TypeScript support with type definitions
- Automatic token refresh

## Installation

```bash
npm install frappe-oauth-nextjs
# or
yarn add frappe-oauth-nextjs
```

## Usage

### Basic Setup

Create an OAuth configuration for your application:

```typescript
// lib/frappe-auth.ts
import { FrappeOAuthConfig, FrappeOAuthClient, generatePKCEPair } from 'frappe-oauth-nextjs';

export const frappeOAuthConfig: FrappeOAuthConfig = {
  baseUrl: process.env.FRAPPE_URL!, // Your Frappe instance URL
  clientId: process.env.OAUTH_CLIENT_ID!,
  clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback`,
  scope: 'openid all', // Adjust scope as needed
  cookieName: 'frappe_session', // Optional: Custom cookie name
  cookieOptions: {
    // Optional: Override default cookie settings
    secure: process.env.NODE_ENV === 'production', // Set to true in production
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  usePKCE: true // Enable PKCE (recommended)
};

// Create an OAuth client instance
export const frappeOAuth = new FrappeOAuthClient(frappeOAuthConfig);
```

### Next.js API Routes for Auth Flow

#### Login Route

```typescript
// pages/api/auth/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { generatePKCEPair } from 'frappe-oauth-nextjs';
import { frappeOAuth } from '@/lib/frappe-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Generate PKCE pair for security
    const { codeVerifier, codeChallenge, codeChallengeMethod } = generatePKCEPair(frappeOAuth);
    
    // Store code verifier in a temporary cookie for retrieval during callback
    res.setHeader('Set-Cookie', `code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    
    // Generate random state for CSRF protection
    const state = frappeOAuth.generateState();
    res.setHeader('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    
    // Generate authorization URL
    const authUrl = frappeOAuth.getAuthorizationUrl({
      state,
      codeVerifier,
      codeChallenge,
      scope: 'openid all'
    });
    
    // Redirect to Frappe authorization page
    res.redirect(authUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to initiate login' });
  }
}
```

#### Callback Route

```typescript
// pages/api/auth/callback.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { parse } from 'cookie';
import { createSession, setSessionCookie } from 'frappe-oauth-nextjs';
import { frappeOAuth, frappeOAuthConfig } from '@/lib/frappe-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code, state, error } = req.query;
    
    // Handle error response from Frappe
    if (error) {
      return res.redirect(`/login?error=${error}`);
    }
    
    // Validate required params
    if (!code || typeof code !== 'string') {
      return res.redirect('/login?error=invalid_request');
    }
    
    // Validate state parameter to prevent CSRF
    const cookies = parse(req.headers.cookie || '');
    const savedState = cookies.oauth_state;
    
    if (!savedState || savedState !== state) {
      return res.redirect('/login?error=invalid_state');
    }
    
    // Get code verifier from cookie
    const codeVerifier = cookies.code_verifier;
    if (!codeVerifier) {
      return res.redirect('/login?error=missing_code_verifier');
    }
    
    // Exchange code for tokens
    const tokenResponse = await frappeOAuth.getToken(code, codeVerifier);
    
    // Create session object
    const session = await createSession(tokenResponse, true, frappeOAuth);
    
    // Store session in a secure cookie
    setSessionCookie(res, session, frappeOAuthConfig);
    
    // Clear temporary cookies
    res.setHeader('Set-Cookie', [
      'code_verifier=; Path=/; HttpOnly; Max-Age=0',
      'oauth_state=; Path=/; HttpOnly; Max-Age=0'
    ]);
    
    // Redirect to dashboard or home page
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Callback error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Failed to complete authentication')}`);
  }
}
```

#### Logout Route

```typescript
// pages/api/auth/logout.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { clearSessionCookie, getSessionCookie } from 'frappe-oauth-nextjs';
import { frappeOAuth, frappeOAuthConfig } from '@/lib/frappe-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get current session
    const session = getSessionCookie(req, frappeOAuthConfig);
    
    // Revoke the token on Frappe server if session exists
    if (session?.tokenSet.access_token) {
      try {
        await frappeOAuth.revokeToken(session.tokenSet.access_token);
      } catch (error) {
        console.error('Error revoking token:', error);
        // Continue with logout even if token revocation fails
      }
    }
    
    // Clear session cookie
    clearSessionCookie(res, frappeOAuthConfig);
    
    // Redirect to login or home page
    res.redirect('/login');
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
}
```

### Authentication Middleware

Create middleware to protect your API routes and pages:

```typescript
// middleware/withAuth.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { checkSession } from 'frappe-oauth-nextjs';
import { frappeOAuthConfig } from '@/lib/frappe-auth';

export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, session: any) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Check and refresh the session if needed
    const session = await checkSession({ req, res }, frappeOAuthConfig);
    
    if (!session) {
      // No valid session, redirect to login
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Call the handler with the verified session
    return handler(req, res, session);
  };
}
```

Use the middleware to protect your API routes:

```typescript
// pages/api/protected-route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/middleware/withAuth';

async function handler(req: NextApiRequest, res: NextApiResponse, session: any) {
  // Your protected API logic here
  res.status(200).json({ 
    message: 'This is a protected route',
    user: session.user
  });
}

export default withAuth(handler);
```

### For Server Components in Next.js App Router

```typescript
// lib/auth.ts
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FrappeSession } from 'frappe-oauth-nextjs';
import { frappeOAuthConfig } from '@/lib/frappe-auth';

export async function getServerSession(): Promise<FrappeSession | null> {
  const cookieStore = cookies();
  const cookieName = frappeOAuthConfig.cookieName || 'frappe_session';
  const sessionCookie = cookieStore.get(cookieName);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const session = JSON.parse(sessionCookie.value) as FrappeSession;
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt <= now) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/api/auth/login');
  }
  
  return session;
}
```

Use in a server component:

```typescript
// app/dashboard/page.tsx
import { requireAuth } from '@/lib/auth';

export default async function DashboardPage() {
  const session = await requireAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user?.name}</p>
      {/* Your protected page content here */}
    </div>
  );
}
```

### Interacting with Frappe API

```typescript
// lib/api.ts
import axios from 'axios';
import { getServerSession } from '@/lib/auth';
import { frappeOAuthConfig } from '@/lib/frappe-auth';

export async function fetchFromFrappeAPI(endpoint: string, options = {}) {
  const session = await getServerSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }
  
  const { tokenSet } = session;
  
  try {
    const response = await axios({
      url: `${frappeOAuthConfig.baseUrl}${endpoint}`,
      headers: {
        Authorization: `${tokenSet.token_type} ${tokenSet.access_token}`
      },
      ...options
    });
    
    return response.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## API Reference

### `FrappeOAuthClient`

The main OAuth client class that handles authentication flows.

#### Constructor

```typescript
new FrappeOAuthClient(config: FrappeOAuthConfig)
```

#### Methods

- `generateCodeVerifier(length?: number): string` - Generate a code verifier for PKCE
- `generateCodeChallenge(codeVerifier: string): string` - Generate a code challenge from verifier
- `generateState(): string` - Generate a random state parameter
- `getAuthorizationUrl(options?: { state?: string, codeVerifier?: string, codeChallenge?: string, scope?: string }): string`
- `getToken(code: string, codeVerifier?: string): Promise<any>`
- `refreshToken(refreshToken: string): Promise<any>`
- `revokeToken(token: string): Promise<void>`
- `getUserInfo(accessToken: string): Promise<FrappeUserInfo>`
- `introspectToken(token: string, tokenTypeHint?: 'access_token' | 'refresh_token'): Promise<any>`

### Session Utilities

- `setSessionCookie(res: NextApiResponse, session: FrappeSession, config: FrappeOAuthConfig): void`
- `getSessionCookie(req: NextApiRequest, config: FrappeOAuthConfig): FrappeSession | null`
- `clearSessionCookie(res: NextApiResponse, config: FrappeOAuthConfig): void`
- `checkSession(options: GetSessionOptions, config: FrappeOAuthConfig): Promise<FrappeSession | null>`
- `createSession(tokenResponse: any, getUserInfo: boolean, oauthClient: FrappeOAuthClient): Promise<FrappeSession>`

### PKCE Utility

- `generatePKCEPair(client: FrappeOAuthClient, length?: number): { codeVerifier: string; codeChallenge: string; codeChallengeMethod: 'S256' }`

## License

MIT