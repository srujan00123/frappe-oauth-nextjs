# Frappe OAuth NextJS Examples

This directory contains examples of how to use the `frappe-oauth-nextjs` package.

## Basic Setup

Here's a basic example of how to set up and use the package in a Next.js application:

### API Routes

Create a file `app/api/auth/[...action]/route.ts`:

```typescript
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
} from 'frappe-oauth-nextjs';

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

  // Handle different API actions
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
      
      // Create cookies and redirect to authorization endpoint
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

  // Handle different API actions
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

### Client-Side Auth Provider

In your root layout or page component:

```tsx
'use client';

import { AuthProvider } from 'frappe-oauth-nextjs';

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

### Using Auth Context in a Component

```tsx
'use client';

import { useAuth } from 'frappe-oauth-nextjs';

export default function Profile() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div>
        <h1>Not Authenticated</h1>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.name || 'User'}</h1>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### API Proxy Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from 'frappe-oauth-nextjs';

export default function TodoList() {
  const { isAuthenticated } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTodos();
    }
  }, [isAuthenticated]);

  async function fetchTodos() {
    try {
      const response = await fetch('/api/frappe/todo?filters={"status":"Open"}');
      const data = await response.json();
      setTodos(data.data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return <div>Please login to view your todos</div>;
  }

  if (loading) {
    return <div>Loading todos...</div>;
  }

  return (
    <div>
      <h1>My Todos</h1>
      <ul>
        {todos.map((todo: any) => (
          <li key={todo.name}>{todo.description}</li>
        ))}
      </ul>
    </div>
  );
}
```

And the API proxy route:

```typescript
// app/api/frappe/[...path]/route.ts
import { NextRequest } from 'next/server';
import { proxyToFrappeApi, FrappeOAuthConfig } from 'frappe-oauth-nextjs';

// Configure Frappe OAuth
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