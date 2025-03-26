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
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the Frappe access_token to the token right after signin
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile?.roles) {
        token.roles = profile.roles;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and roles
      session.accessToken = token.accessToken as string;
      session.user.roles = token.roles as string[];
      return session;
    },
  },
};

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
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the Frappe access_token to the token right after signin
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile?.roles) {
        token.roles = profile.roles;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and roles
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

export default function Profile() {
  const { data: session, status } = useSession();

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
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
```

### Protected Route Example

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
    }
  }, [status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Protected Page</h1>
      <p>You are logged in as {session?.user?.name}</p>
    </div>
  );
}
```

### API Route with Session Authentication

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

  // You can access the Frappe token from the session
  const accessToken = session.accessToken;

  // You can check user roles
  const isAdmin = session.user.roles?.includes("Administrator");

  return NextResponse.json({
    message: `Hello ${session.user.name}`,
    isAdmin,
  });
}
```

Or for Pages API route:

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

  // You can access the Frappe token from the session
  const accessToken = session.accessToken;

  // You can check user roles
  const isAdmin = session.user.roles?.includes("Administrator");

  return res.json({
    message: `Hello ${session.user.name}`,
    isAdmin,
  });
}
```

### Fetching Data from Frappe Server with Access Token

```tsx
'use client';

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function TodoList() {
  const { data: session, status } = useSession();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.accessToken) {
      fetchTodos();
    }
  }, [session]);

  async function fetchTodos() {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_FRAPPE_SERVER_URL}/api/resource/Todo`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });
      const data = await response.json();
      setTodos(data.data || []);
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Please login to view your todos</div>;
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

## Frappe-Specific Extensions

### Types for TypeScript

Extend the NextAuth session type in your project to include Frappe-specific fields:

```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface Profile {
    roles?: string[];
  }

  interface JWT {
    accessToken?: string;
    roles?: string[];
  }
}
```

### Custom Frappe API Wrapper

You can create a utility function to make authenticated requests to your Frappe server:

```typescript
// utils/frappe-api.ts
import { getSession } from "next-auth/react";

export async function frappeApiCall(endpoint: string, options: RequestInit = {}) {
  const session = await getSession();
  
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "API call failed");
  }
  
  return response.json();
}
```

Then use it in your components:

```tsx
import { frappeApiCall } from "../utils/frappe-api";

export default function UserProfile() {
  const [profile, setProfile] = useState(null);
  
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await frappeApiCall("resource/User?fields=[\"name\",\"email\",\"full_name\"]");
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }
    
    fetchProfile();
  }, []);
  
  // Render the profile
}
``` 