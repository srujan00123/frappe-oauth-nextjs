# Frappe OAuth for Next.js

A comprehensive OAuth client package for integrating Frappe with Next.js applications. Provides full authentication flow, secure session management, and API proxy utilities.

## Features

- **Modern API Routes Support**: Designed for App Router and Next.js API Routes
- **Secure Session Management**: Server-side cookie storage for secure token handling
- **Full Authentication Flow**: Complete OAuth flow with PKCE support
- **API Proxy Utilities**: Easily proxy requests to Frappe API while handling authentication
- **React Integration**: Authentication context provider and hooks for client-side integration
- **TypeScript Support**: Fully typed API for better developer experience

## Installation

```bash
npm install frappe-oauth-next
```

## Basic Usage

### 1. API Routes Setup

Create API routes to handle authentication flow:

```typescript
// app/api/auth/[...action]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  checkAuth,
  logout,
  refreshToken,
  getServerInfo,
  exchangeToken,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  FrappeOAuthConfig
} from 'frappe-oauth-next';

// Configure Frappe OAuth
const config: FrappeOAuthConfig = {
  clientId: process.env.FRAPPE_CLIENT_ID || '',
  serverUrl: process.env.FRAPPE_SERVER_URL || '',
  redirectUri: process.env.REDIRECT_URI || '',
  scope: 'all openid'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const action = params.action;

  switch (action) {
    case 'check':
      return checkAuth(request, config);
    case 'server':
      return getServerInfo(request, config);
    case 'login': {
      // Generate PKCE code verifier and challenge
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = generateCodeChallenge(codeVerifier);
      
      // Generate state for CSRF protection
      const state = generateState();
      
      // Create the cookies for code verifier and state
      const cookieStore = request.cookies;
      const response = NextResponse.redirect(
        `${config.serverUrl}/oauth/authorize?` + 
        `client_id=${config.clientId}&` +
        `redirect_uri=${encodeURIComponent(config.redirectUri)}&` + 
        `response_type=code&` +
        `state=${state}&` +
        `scope=${encodeURIComponent(config.scope || 'all openid')}&` +
        `code_challenge=${codeChallenge}&` +
        `code_challenge_method=S256`
      );
      
      // Store code verifier and state in cookies
      response.cookies.set('code_verifier', codeVerifier, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60, // 10 minutes
        path: '/' 
      });
      
      response.cookies.set('oauth_state', state, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60, // 10 minutes
        path: '/' 
      });
      
      return response;
    }
    case 'callback': {
      // Get code and state from URL
      const searchParams = request.nextUrl.searchParams;
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      
      // Verify parameters
      if (!code) {
        return NextResponse.redirect('/auth/error?error=missing_code');
      }
      
      // Verify state parameter
      const savedState = request.cookies.get('oauth_state')?.value;
      if (!savedState || savedState !== state) {
        return NextResponse.redirect('/auth/error?error=invalid_state');
      }
      
      // Get code verifier
      const codeVerifier = request.cookies.get('code_verifier')?.value;
      if (!codeVerifier) {
        return NextResponse.redirect('/auth/error?error=missing_verifier');
      }
      
      try {
        // Exchange code for tokens
        const tokenResponse = await exchangeToken(
          NextResponse.json({ code, codeVerifier }) as unknown as NextRequest,
          config
        );
        
        // Clear temporary cookies
        const response = NextResponse.redirect('/dashboard');
        response.cookies.delete('code_verifier');
        response.cookies.delete('oauth_state');
        
        return response;
      } catch (error) {
        console.error('Token exchange error:', error);
        return NextResponse.redirect('/auth/error?error=token_exchange_failed');
      }
    }
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  const action = params.action;

  switch (action) {
    case 'token':
      return exchangeToken(request, config);
    case 'refresh':
      return refreshToken(request, config);
    case 'logout':
      return logout(request, config);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}
```

### 2. Client-Side Integration

Wrap your application with the `AuthProvider`:

```tsx
// app/layout.tsx
'use client';

import { AuthProvider } from 'frappe-oauth-next';

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Using the Auth Hook

Use the `useAuth` hook in your components:

```tsx
'use client';

import { useAuth } from 'frappe-oauth-next';

export default function LoginButton() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  if (isLoading) {
    return <button disabled>Loading...</button>;
  }

  if (isAuthenticated) {
    return <button onClick={logout}>Logout ({user?.name})</button>;
  }

  return <button onClick={login}>Login</button>;
}
```

### 4. API Proxy

Create an API proxy to forward requests to Frappe:

```typescript
// app/api/frappe/[...path]/route.ts
import { NextRequest } from 'next/server';
import { proxyToFrappeApi, FrappeOAuthConfig } from 'frappe-oauth-next';

const config: FrappeOAuthConfig = {
  clientId: process.env.FRAPPE_CLIENT_ID || '',
  serverUrl: process.env.FRAPPE_SERVER_URL || '',
  redirectUri: process.env.REDIRECT_URI || '',
  scope: 'all openid'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return proxyToFrappeApi(request, `/api/resource/${path}`, config);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  return proxyToFrappeApi(request, `/api/resource/${path}`, config);
}
```

## Configuration Options

The `FrappeOAuthConfig` interface supports the following options:

```typescript
interface FrappeOAuthConfig {
  clientId: string;            // OAuth client ID
  serverUrl: string;           // Frappe server URL
  redirectUri: string;         // OAuth redirect URI
  scope?: string;              // OAuth scope (default: 'all openid')
  tokenEndpoint?: string;      // Custom token endpoint
  authorizationEndpoint?: string; // Custom authorization endpoint
  logoutEndpoint?: string;     // Custom logout endpoint
  userInfoEndpoint?: string;   // Custom userinfo endpoint
  cookieName?: string;         // Session cookie name (default: 'frappe_oauth_session')
}
```

## Advanced Usage

For more advanced usage examples, check the [examples](./examples) directory.

## API Reference

### Server-Side Utilities

- `checkAuth`: Check if the user is authenticated
- `refreshToken`: Refresh the access token
- `logout`: Logout the user and revoke tokens
- `getServerInfo`: Get OAuth server information
- `proxyToFrappeApi`: Proxy requests to Frappe API with authentication

### Client-Side Utilities

- `AuthProvider`: React context provider for authentication
- `useAuth`: React hook to access authentication state and methods
- `AuthContext`: Raw React context for custom implementations

### PKCE Utilities

- `generateCodeVerifier`: Generate a PKCE code verifier
- `generateCodeChallenge`: Generate a PKCE code challenge
- `generateState`: Generate a random state parameter

## License

MIT