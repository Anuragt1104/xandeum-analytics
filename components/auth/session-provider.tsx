'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider as NextAuthProvider, useSession as useNextAuthSession } from 'next-auth/react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

// Combined session type
interface CombinedSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string;
    walletAddress?: string | null;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const SessionContext = createContext<CombinedSession>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
});

export function useSession() {
  return useContext(SessionContext);
}

// Supabase session provider
function SupabaseSessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();

    // Get initial session with error handling
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Supabase session error:', error);
        }
        setUser(session?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to get Supabase session:', err);
        setIsLoading(false); // Always resolve loading state
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Timeout fallback to ensure loading resolves
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Session loading timeout, resolving...');
        setIsLoading(false);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  const sessionValue: CombinedSession = {
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0],
      image: user.user_metadata?.avatar_url,
      role: user.user_metadata?.role || 'USER',
      walletAddress: user.user_metadata?.wallet_address,
    } : null,
    isAuthenticated: !!user,
    isLoading,
  };

  return (
    <SessionContext.Provider value={sessionValue}>
      {children}
    </SessionContext.Provider>
  );
}

// NextAuth session context wrapper
function NextAuthSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useNextAuthSession();

  const sessionValue: CombinedSession = {
    user: session?.user ? {
      id: (session.user as { id?: string }).id ?? '',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: (session.user as { role?: string }).role,
      walletAddress: (session.user as { walletAddress?: string }).walletAddress,
    } : null,
    isAuthenticated: !!session?.user,
    isLoading: status === 'loading',
  };

  return (
    <SessionContext.Provider value={sessionValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Combined provider that uses Supabase if configured, otherwise NextAuth
export function SessionProvider({ children }: { children: React.ReactNode }) {
  // Check if Supabase is configured
  const useSupabase = isSupabaseConfigured();

  if (useSupabase) {
    return (
      <SupabaseSessionProvider>
        {children}
      </SupabaseSessionProvider>
    );
  }

  // Fallback to NextAuth - wrap with both providers
  return (
    <NextAuthProvider>
      <NextAuthSessionProvider>
        {children}
      </NextAuthSessionProvider>
    </NextAuthProvider>
  );
}
