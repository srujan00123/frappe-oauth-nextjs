# Frappe NextAuth Examples

This directory contains examples of how to use the `frappe-next-auth` package with Next.js and NextAuth.js.

## Basic Setup

Here's a basic example of how to set up and use the package in a Next.js application:

### API Routes (Next.js App Router)

Create a file `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from "next-auth";
import FrappeProvider from "frappe-next-auth";

export const authOptions = {
  providers: [
    FrappeProvider({
      clientId: process.env.FRAPPE_CLIENT_ID || '',
      clientSecret: process.env.FRAPPE_CLIENT_SECRET || '',
      serverUrl: process.env.FRAPPE_SERVER_URL || '',
      authorization: {
        params: {
          scope: "openid all"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the Frappe access_token to the token right after signin
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      if (profile?.roles) {
        token.roles = profile.roles;
      }
      
      // Handle token refresh if needed
      if (token.expiresAt && Date.now() > token.expiresAt * 1000 - 60000) {
        return await refreshAccessToken(token);
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and roles
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      session.user.roles = token.roles as string[];
      session.error = token.error as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Use secure cookies in production
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    // Make a request to the token endpoint
    const response = await fetch(`${process.env.FRAPPE_SERVER_URL}/api/method/frappe.integrations.oauth2.get_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: process.env.FRAPPE_CLIENT_ID || '',
      })
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### API Routes (Next.js Pages Router)

Create a file `pages/api/auth/[...nextauth].ts`:

```typescript
import NextAuth from "next-auth";
import FrappeProvider from "frappe-next-auth";
import { NextApiRequest, NextApiResponse } from "next";

export const authOptions = {
  providers: [
    FrappeProvider({
      clientId: process.env.FRAPPE_CLIENT_ID || '',
      clientSecret: process.env.FRAPPE_CLIENT_SECRET || '',
      serverUrl: process.env.FRAPPE_SERVER_URL || '',
      authorization: {
        params: {
          scope: "openid all"
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the Frappe access_token to the token right after signin
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      if (profile?.roles) {
        token.roles = profile.roles;
      }
      
      // Handle token refresh if needed
      if (token.expiresAt && Date.now() > token.expiresAt * 1000 - 60000) {
        return await refreshAccessToken(token);
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and roles
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.expiresAt = token.expiresAt as number;
      session.user.roles = token.roles as string[];
      session.error = token.error as string;
      return session;
    },
  },
};

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    // Make a request to the token endpoint
    const response = await fetch(`${process.env.FRAPPE_SERVER_URL}/api/method/frappe.integrations.oauth2.get_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: process.env.FRAPPE_CLIENT_ID || '',
      })
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}
```

### Environment Variables

```env
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Frappe OAuth settings
FRAPPE_CLIENT_ID=your-frappe-client-id
FRAPPE_CLIENT_SECRET=your-frappe-client-secret
FRAPPE_SERVER_URL=https://your-frappe-server.com
```

### Client-Side Authentication with SessionProvider

In your root layout or page component:

```tsx
// app/layout.tsx (App Router)
'use client';

import { SessionProvider } from "next-auth/react";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

Or for Pages Router:

```tsx
// pages/_app.tsx
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
```

### Using Auth Hooks in a Component

```tsx
'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function Profile() {
  const { data: session, status, update } = useSession();

  // Handle refresh token error
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      // Force sign in to resolve the refresh token error
      signIn();
    }
  }, [session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <h1>Not Authenticated</h1>
        <button onClick={() => signIn("frappe")}>Login with Frappe</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {session?.user?.name || 'User'}</h1>
      <p>Email: {session?.user?.email}</p>
      <p>Roles: {session?.user?.roles?.join(", ") || "No roles"}</p>
      <p>Access Token: {session?.accessToken ? "Available" : "Not available"}</p>
      <p>Token expires: {session?.expiresAt ? new Date(session.expiresAt * 1000).toLocaleString() : "Unknown"}</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

### Protected Route with Role-Based Access Control

```tsx
// app/protected/page.tsx (App Router)
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    } else if (session && !session.user.roles?.includes("Administrator")) {
      // Role-based access control - only allow Administrators
      router.push("/unauthorized");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Protected Admin Page</h1>
      <p>You are logged in as {session?.user?.name} with Administrator role</p>
    </div>
  );
}
```

### API Route with Token Introspection

```typescript
// app/api/protected/route.ts (App Router)
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Introspect the token to verify it's still valid
    const tokenStatus = await introspectToken(session.accessToken);
    
    if (!tokenStatus.active) {
      return NextResponse.json({ error: "Token expired or revoked" }, { status: 401 });
    }
    
    // Check user roles
    const isAdmin = session.user.roles?.includes("Administrator");
    
    // You can also use the roles from token introspection
    // const isAdmin = tokenStatus.roles?.includes("Administrator");

    return NextResponse.json({
      message: `Hello ${session.user.name}`,
      isAdmin,
      roles: session.user.roles
    });
  } catch (error) {
    console.error("Token introspection error:", error);
    return NextResponse.json({ error: "Authentication error" }, { status: 500 });
  }
}

/**
 * Introspects a token to check if it's still valid
 */
async function introspectToken(token: string) {
  const response = await fetch(`${process.env.FRAPPE_SERVER_URL}/api/method/frappe.integrations.oauth2.introspect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token,
      token_type_hint: 'access_token'
    })
  });
  
  if (!response.ok) {
    throw new Error("Failed to introspect token");
  }
  
  return await response.json();
}
```

For Pages API route:

```typescript
// pages/api/protected.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Introspect the token to verify it's still valid
    const tokenStatus = await introspectToken(session.accessToken);
    
    if (!tokenStatus.active) {
      return res.status(401).json({ error: "Token expired or revoked" });
    }
    
    // Check user roles
    const isAdmin = session.user.roles?.includes("Administrator");

    return res.json({
      message: `Hello ${session.user.name}`,
      isAdmin,
      roles: session.user.roles
    });
  } catch (error) {
    console.error("Token introspection error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
}

/**
 * Introspects a token to check if it's still valid
 */
async function introspectToken(token: string) {
  const response = await fetch(`${process.env.FRAPPE_SERVER_URL}/api/method/frappe.integrations.oauth2.introspect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token,
      token_type_hint: 'access_token'
    })
  });
  
  if (!response.ok) {
    throw new Error("Failed to introspect token");
  }
  
  return await response.json();
}
```

### Fetching Data from Frappe Server with Access Token and Token Refresh Handling

```tsx
'use client';

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect } from "react";

export default function TodoList() {
  const { data: session, status } = useSession();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.accessToken) {
      fetchTodos();
    }
  }, [session]);

  // Handle refresh token errors
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      setError("Your session has expired. Please sign in again.");
      // Force sign in to resolve the refresh token error
      signIn();
    }
  }, [session]);

  async function fetchTodos() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL}/api/resource/Todo`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error("Authentication error - token may be expired");
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setTodos(data.data || []);
      setError(null);
    } catch (error) {
      console.error("Error fetching todos:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        <p>Please login to view your todos</p>
        <button onClick={() => signIn("frappe")}>Sign in</button>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>My Todos</h1>
      {todos.length === 0 ? (
        <p>No todos found</p>
      ) : (
        <ul>
          {todos.map((todo: any) => (
            <li key={todo.name}>{todo.description}</li>
          ))}
        </ul>
      )}
      <button onClick={fetchTodos}>Refresh Todos</button>
    </div>
  );
}
```

## Frappe-Specific Extensions

### Types for TypeScript

Extend the NextAuth session type in your project to include Frappe-specific fields:

```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
    user: {
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface Profile {
    sub: string;
    name: string;
    email?: string;
    picture?: string;
    roles?: string[];
    given_name?: string;
    family_name?: string;
    iss: string;
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    roles?: string[];
    error?: string;
  }
}
```

### Custom Frappe API Wrapper with Token Refresh Handling

You can create a utility function to make authenticated requests to your Frappe server with built-in token refresh handling:

```typescript
// utils/frappe-api.ts
import { getSession, signIn } from "next-auth/react";

export async function frappeApiCall(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }
  
  // Check if token is expired or about to expire
  if (session.error === "RefreshAccessTokenError" || 
      (session.expiresAt && Date.now() > session.expiresAt * 1000 - 60000)) {
    console.warn("Token expired or about to expire, redirecting to sign in");
    signIn();
    throw new Error("Session expired. Redirecting to login.");
  }
  
  const url = `${process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL}/api/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!response.ok) {
    // Handle specific error cases
    if (response.status === 401) {
      // Token might be invalid or expired
      signIn();
      throw new Error("Authentication error - redirecting to login");
    }
    
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Wrapper for handling token revocation on logout
 */
export async function revokeToken(token: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL}/api/method/frappe.integrations.oauth2.revoke_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
      })
    });
    
    return response.ok;
  } catch (error) {
    console.error("Failed to revoke token:", error);
    return false;
  }
}
```

Then use it in your components:

```tsx
import { frappeApiCall, revokeToken } from "../utils/frappe-api";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";

export default function UserProfile() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await frappeApiCall("resource/User?fields=[\"name\",\"email\",\"full_name\"]");
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (session?.accessToken) {
      fetchProfile();
    }
  }, [session]);
  
  // Custom logout that revokes the token
  const handleLogout = async () => {
    if (session?.accessToken) {
      await revokeToken(session.accessToken);
    }
    signOut();
  };
  
  // Render the profile
  if (loading) return <div>Loading profile...</div>;
  
  return (
    <div>
      <h1>User Profile</h1>
      {profile ? (
        <div>
          <p>Name: {profile.data.full_name}</p>
          <p>Email: {profile.data.email}</p>
        </div>
      ) : (
        <p>No profile data available</p>
      )}
      <button onClick={handleLogout}>Secure Logout</button>
    </div>
  );
}
```

### Using JWT ID Token

The Frappe provider properly handles ID tokens. Here's how to decode and use them:

```typescript
// server-side code to verify and use ID token
import jwt from 'jsonwebtoken';

export async function verifyIdToken(idToken: string, clientId: string, clientSecret: string) {
  try {
    const payload = jwt.verify(idToken, clientSecret, {
      audience: clientId,
      algorithms: ['HS256'],
    });
    
    return payload;
  } catch (error) {
    console.error('ID Token verification failed:', error);
    return null;
  }
}

// Usage in API route
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  // You can access the ID token and verify it if needed
  const idTokenPayload = await verifyIdToken(
    session.idToken,
    process.env.FRAPPE_CLIENT_ID!,
    process.env.FRAPPE_CLIENT_SECRET!
  );
  
  return new Response(JSON.stringify({ 
    user: session.user,
    idTokenPayload
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
``` 