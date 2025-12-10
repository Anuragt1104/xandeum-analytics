'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, User, Loader2, Wallet } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Auto login after registration
      const loginResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError('Registration successful, but login failed. Please try logging in.');
        setActiveTab('login');
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Check if Phantom is installed
      const { solana } = window as unknown as { solana?: { isPhantom?: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }>; signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }> } };
      
      if (!solana?.isPhantom) {
        setError('Please install Phantom wallet to continue');
        return;
      }

      // Connect wallet
      const response = await solana.connect();
      const walletAddress = response.publicKey.toString();

      // Create message to sign
      const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const message = `Sign this message to authenticate with Xandeum Analytics.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${Date.now()}`;
      
      // Sign message
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await solana.signMessage(encodedMessage, 'utf8');
      
      // Convert signature to base58
      const bs58 = await import('bs58');
      const signature = bs58.default.encode(signedMessage.signature);

      // Authenticate
      const result = await signIn('wallet', {
        walletAddress,
        signature,
        message,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      console.error('Wallet login error:', err);
      setError('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Welcome to XPAP
          </DialogTitle>
          <DialogDescription>
            Sign in to access operator features and claim your pNode.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleWalletLogin}
              disabled={isLoading}
            >
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Password (min 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

