# Frappe NextAuth

A [NextAuth.js](https://next-auth.js.org/) provider for [Frappe](https://frappeframework.com/) to easily integrate Frappe authentication with Next.js applications.

## Features

- Complete Frappe OAuth provider for NextAuth.js
- Support for both App Router and Pages Router
- TypeScript support with proper type definitions
- Access Frappe resources with OAuth tokens
- User role management through Frappe

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
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the Frappe access_token to the token
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      if (profile?.roles) {
        token.roles = profile.roles;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken as string;
      session.user.roles = token.roles as string[];
      return session;
    },
  },
};

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

export default function Component() {
  const { data: session, status } = useSession();

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

## Type Definitions

To add type support for the Frappe-specific fields, create a `next-auth.d.ts` file in your `types` folder:

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

## Advanced Usage

For more advanced usage examples, check out the [examples folder](./examples).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.