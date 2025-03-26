# Frappe NextAuth

A [NextAuth.js](https://next-auth.js.org/) provider for [Frappe](https://frappeframework.com/) to easily integrate Frappe authentication with Next.js applications.

## Features

- Complete Frappe OAuth2 provider for NextAuth.js with OpenID Connect support
- PKCE (Proof Key for Code Exchange) flow for enhanced security
- Role-based access control using Frappe's user roles
- Access to Frappe resources with OAuth tokens
- Automatic token refresh and introspection
- TypeScript support with proper type definitions
- Support for both App Router and Pages Router

## Installation

```bash
npm install frappe-next-auth next-auth
# or
yarn add frappe-next-auth next-auth
# or
pnpm add frappe-next-auth next-auth
```

## Basic Usage

### Setup NextAuth.js with Frappe Provider

First, create a NextAuth.js API route in your Next.js application.

#### For App Router (Next.js 13+)

```typescript
// app/api/auth/[...nextauth]/route.ts
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
      // Persist the Frappe access_token and other details to the token
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      // Store roles from the OpenID profile
      if (profile?.roles) {
        token.roles = profile.roles;
      }
      
      // Handle token refresh if needed
      if (token.expiresAt && Date.now() > token.expiresAt * 1000 - 60000) {
        // Token is about to expire (within 1 minute)
        return await refreshAccessToken(token);
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
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

#### For Pages Router

```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import FrappeProvider from "frappe-next-auth";
import { NextApiRequest, NextApiResponse } from "next";

export const authOptions = {
  providers: [
    FrappeProvider({
      clientId: process.env.FRAPPE_CLIENT_ID || '',
      clientSecret: process.env.FRAPPE_CLIENT_SECRET || '',
      serverUrl: process.env.FRAPPE_SERVER_URL || '',
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile?.roles) {
        token.roles = profile.roles;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.roles = token.roles as string[];
      return session;
    },
  },
};

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}
```

### Environment Variables

Add these environment variables to your `.env.local` file:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Frappe OAuth settings
FRAPPE_CLIENT_ID=your-frappe-client-id
FRAPPE_CLIENT_SECRET=your-frappe-client-secret
FRAPPE_SERVER_URL=https://your-frappe-server.com
```

### Using in Your Application

Wrap your application with the `SessionProvider`:

```tsx
// In _app.tsx (Pages Router)
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
```

Then use the session in your components:

```tsx
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function Component() {
  const { data: session, status } = useSession();

  // Handle refresh token errors
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn(); // Force sign in to resolve the refresh token error
    }
  }, [session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <div>
        Not signed in <br />
        <button onClick={() => signIn("frappe")}>Sign in with Frappe</button>
      </div>
    );
  }

  return (
    <div>
      Signed in as {session.user.name} <br />
      <p>Roles: {session.user.roles?.join(", ") || "No roles"}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

## Frappe API Access

To access protected Frappe API endpoints using the access token:

```tsx
const { data: session } = useSession();

// Make authenticated requests to Frappe
const fetchData = async () => {
  if (!session?.accessToken) return;
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL}/api/resource/Todo`, {
    headers: {
      'Authorization': `Bearer ${session.accessToken}`
    }
  });
  
  const data = await response.json();
  // Process the data
};
```

## Role-Based Access Control

Frappe provides user roles in the OpenID profile which you can use for access control:

```tsx
const { data: session } = useSession();

// Check if user has administrator role
const isAdmin = session?.user?.roles?.includes('Administrator');

// Conditional rendering based on role
return (
  <div>
    <h1>Welcome, {session?.user?.name}</h1>
    
    {isAdmin && (
      <div>
        <h2>Admin Panel</h2>
        {/* Admin-only features */}
      </div>
    )}
    
    {/* Common features for all authenticated users */}
  </div>
);
```

## Token Handling

### Token Refresh

The Frappe provider has built-in token refresh support. When the access token expires, the refresh token is automatically used to get a new access token.

### Token Revocation

When a user signs out, you can revoke their token at the Frappe server:

```tsx
const { data: session } = useSession();

const handleSignOut = async () => {
  if (session?.accessToken) {
    // Revoke the token at Frappe server
    await fetch(`${process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL}/api/method/frappe.integrations.oauth2.revoke_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: session.accessToken,
      })
    });
  }
  
  // Sign out from NextAuth
  signOut();
};
```

### Token Introspection

You can check if a token is still valid using Frappe's introspection endpoint:

```typescript
// Server-side token validation
async function validateToken(token: string) {
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
  
  const data = await response.json();
  return data.active === true;
}
```

## ID Token Verification

Frappe provides ID tokens as part of the OpenID Connect flow. You can verify these tokens server-side:

```typescript
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
```

## Type Definitions

To add type support for the Frappe-specific fields, create a `next-auth.d.ts` file in your `types` folder:

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

## Advanced Usage

For more advanced usage examples, check out the [examples folder](./examples).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.