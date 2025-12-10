'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { signIn } from 'next-auth/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'login' | 'register' | 'magic-link';

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const useSupabase = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (useSupabase) {
        const supabase = getSupabase();

        if (mode === 'magic-link') {
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) throw error;
          setSuccess('Check your email for the magic link!');
          return;
        }

        if (mode === 'register') {
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });
          if (error) throw error;
          setSuccess('Check your email to confirm your account!');
          return;
        }

        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
        window.location.reload();
      } else {
        // Fallback to NextAuth
        if (mode === 'register') {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Registration failed');
          setSuccess('Account created! You can now log in.');
          setMode('login');
          return;
        }

        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });
        if (result?.error) throw new Error('Invalid credentials');
        onClose();
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-cyan-400 to-primary" />

          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="inline-flex p-3 rounded-xl bg-primary/10 mb-2"
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </motion.div>
              <h2 className="text-2xl font-bold">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'register' && 'Create Account'}
                {mode === 'magic-link' && 'Magic Link'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'login' && 'Sign in to manage your pNodes'}
                {mode === 'register' && 'Join the Xandeum network'}
                {mode === 'magic-link' && 'We\'ll send you a login link'}
              </p>
            </div>

            {/* Error/Success messages */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-500 text-sm"
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 bg-background/50"
                    />
                  </div>
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
              </div>

              {mode !== 'magic-link' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-background/50"
                      required
                      minLength={8}
                    />
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full h-11 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'login' ? (
                  'Sign In'
                ) : mode === 'register' ? (
                  'Create Account'
                ) : (
                  'Send Magic Link'
                )}
              </Button>
            </form>

            {/* Mode switchers */}
            <div className="space-y-3 pt-2">
              {mode !== 'magic-link' && useSupabase && (
                <button
                  type="button"
                  onClick={() => setMode('magic-link')}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in with magic link instead
                </button>
              )}

              <div className="text-center text-sm">
                {mode === 'login' ? (
                  <span className="text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign up
                    </button>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                        setSuccess(null);
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Demo credentials hint */}
            {!useSupabase && (
              <div className="text-xs text-center text-muted-foreground bg-muted/50 rounded-lg p-2">
                Demo mode: Use demo@xandeum.com / password123
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
