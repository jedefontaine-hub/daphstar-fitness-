import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { NextAuthOptions } from 'next-auth';

const parseAllowedGithubUsers = () => {
  const raw = process.env.ADMIN_GITHUB_USERS || '';
  return raw
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
};

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || ''
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const expected = process.env.ADMIN_PASSWORD;
        if (!expected) return null;
        if (!credentials) return null;
        if (credentials.password === expected) {
          return { id: 'admin', name: 'Admin' };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'github') {
        const allowed = parseAllowedGithubUsers();
        // If allowlist is set, require GitHub username/email to be listed.
        if (allowed.length > 0) {
          const login =
            profile && typeof profile === 'object' && 'login' in profile
              ? String(profile.login || '').toLowerCase()
              : '';
          const email = String(user?.email || '').toLowerCase();
          if (!allowed.includes(login) && !allowed.includes(email)) {
            return false;
          }
        }
      }
      return true;
    }
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin/login'
  },
  secret: process.env.NEXTAUTH_SECRET
};
