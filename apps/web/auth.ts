import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { backendFetch } from './lib/backend';

declare module 'next-auth' {
  interface Session {
    accountId?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (!account) return token;
      if (account.provider !== 'google' || !profile?.sub || profile.sub !== account.providerAccountId) {
        throw new Error('Invalid Google identity');
      }
      const result = await backendFetch('/identity/google-login', {
        method: 'POST', googleSubject: profile.sub,
      });
      if (!result.ok) throw new Error('Application account unavailable');
      const { id } = await result.json() as { id?: string };
      if (!id) throw new Error('Missing application account ID');
      token.accountId = id;
      return token;
    },
    session({ session, token }) {
      if (typeof token.accountId === 'string') session.accountId = token.accountId;
      return session;
    },
  },
});
