'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider as NextAuthProvider } from 'next-auth/react';
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

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
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

  // Fallback to NextAuth
  return (
    <NextAuthProvider>
      {children}
    </NextAuthProvider>
  );
}
