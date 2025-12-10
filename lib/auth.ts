// NextAuth.js Configuration and Utilities
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare, hash } from 'bcryptjs';
import { prisma, isDatabaseAvailable } from './db';

// Extend session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      role: 'USER' | 'OPERATOR' | 'ADMIN';
      walletAddress?: string | null;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role: 'USER' | 'OPERATOR' | 'ADMIN';
    walletAddress?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'USER' | 'OPERATOR' | 'ADMIN';
    walletAddress?: string | null;
  }
}

// Demo user for when database is not available
const DEMO_USER = {
  id: 'demo-user-1',
  email: 'demo@xandeum.com',
  name: 'Demo User',
  hashedPassword: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.6OlNJDqB4x9g8.', // "password123"
  role: 'ADMIN' as const,
  walletAddress: null,
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // If database is available, use it
          if (isDatabaseAvailable() && prisma) {
            const user = await prisma.user.findUnique({
              where: { email: credentials.email },
            });

            if (!user || !user.hashedPassword) {
              throw new Error('Invalid email or password');
            }

            const isValid = await compare(credentials.password, user.hashedPassword);
            if (!isValid) {
              throw new Error('Invalid email or password');
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              walletAddress: user.walletAddress,
            };
          }

          // Demo mode when database is not available
          if (credentials.email === DEMO_USER.email) {
            const isValid = await compare(credentials.password, DEMO_USER.hashedPassword);
            if (isValid) {
              return {
                id: DEMO_USER.id,
                email: DEMO_USER.email,
                name: DEMO_USER.name,
                role: DEMO_USER.role,
                walletAddress: DEMO_USER.walletAddress,
              };
            }
          }

          throw new Error('Invalid email or password');
        } catch (error) {
          console.error('Auth error:', error);
          throw error;
        }
      },
    }),
    // Wallet-based authentication (for claiming nodes)
    CredentialsProvider({
      id: 'wallet',
      name: 'Wallet',
      credentials: {
        walletAddress: { label: 'Wallet Address', type: 'text' },
        signature: { label: 'Signature', type: 'text' },
        message: { label: 'Message', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.walletAddress || !credentials?.signature || !credentials?.message) {
          throw new Error('Wallet verification failed');
        }

        try {
          // Verify the signature
          const isValidSignature = await verifyWalletSignature(
            credentials.walletAddress,
            credentials.message,
            credentials.signature
          );

          if (!isValidSignature) {
            throw new Error('Invalid wallet signature');
          }

          // If database is available, use it
          if (isDatabaseAvailable() && prisma) {
            // Find or create user
            let user = await prisma.user.findUnique({
              where: { walletAddress: credentials.walletAddress },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  walletAddress: credentials.walletAddress,
                  role: 'OPERATOR',
                },
              });
            }

            return {
              id: user.id,
              email: user.email,
              name: user.name || `Operator ${credentials.walletAddress.slice(0, 8)}`,
              role: user.role,
              walletAddress: user.walletAddress,
            };
          }

          // Demo mode: return a demo operator
          return {
            id: `wallet-${credentials.walletAddress.slice(0, 8)}`,
            email: null,
            name: `Operator ${credentials.walletAddress.slice(0, 8)}`,
            role: 'OPERATOR',
            walletAddress: credentials.walletAddress,
          };
        } catch (error) {
          console.error('Wallet auth error:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.walletAddress = token.walletAddress;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      console.log(`User signed in: ${user.email || user.walletAddress}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

// Verify Solana wallet signature
async function verifyWalletSignature(
  walletAddress: string,
  message: string,
  signature: string
): Promise<boolean> {
  try {
    // Import bs58 for decoding
    const bs58 = await import('bs58');
    const { PublicKey } = await import('@solana/web3.js');
    const nacl = await import('tweetnacl');

    const publicKey = new PublicKey(walletAddress);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.default.decode(signature);

    return nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Helper to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

// Helper to create a message for wallet signing
export function createSignMessage(walletAddress: string, nonce: string): string {
  return `Sign this message to authenticate with Xandeum Analytics.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
}

// Generate nonce for wallet auth
export function generateNonce(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Check if user has required role
export function hasRole(
  userRole: 'USER' | 'OPERATOR' | 'ADMIN' | undefined,
  requiredRole: 'USER' | 'OPERATOR' | 'ADMIN'
): boolean {
  const roleHierarchy = { USER: 0, OPERATOR: 1, ADMIN: 2 };
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
