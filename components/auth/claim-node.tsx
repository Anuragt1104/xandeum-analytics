'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Server,
  Wallet,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { PNode } from '@/lib/types';
import { truncatePubkey } from '@/lib/prpc-client';

interface ClaimNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: PNode;
  onClaimed?: () => void;
}

export function ClaimNodeModal({ isOpen, onClose, node, onClaimed }: ClaimNodeModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<'connect' | 'verify' | 'customize' | 'complete'>('connect');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  // Customization fields
  const [customName, setCustomName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');

  const handleConnectWallet = async () => {
    setError(null);
    setIsLoading(true);

    try {
      // Check if we're in browser
      if (typeof window === 'undefined') {
        setError('Wallet connection requires a browser');
        return;
      }

      const { solana } = window as unknown as {
        solana?: {
          isPhantom?: boolean;
          isConnected?: boolean;
          connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
          publicKey?: { toString: () => string };
        }
      };

      if (!solana) {
        setError('No Solana wallet found. Please install Phantom wallet.');
        return;
      }

      if (!solana.isPhantom) {
        setError('Please install Phantom wallet to continue');
        return;
      }

      // Check if already connected
      if (solana.isConnected && solana.publicKey) {
        setWalletAddress(solana.publicKey.toString());
        setStep('verify');
        return;
      }

      const response = await solana.connect();
      if (response?.publicKey) {
        setWalletAddress(response.publicKey.toString());
        setStep('verify');
      } else {
        setError('Failed to get wallet address');
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      const error = err as { code?: number; message?: string };

      // Handle specific Phantom errors
      if (error.code === 4001) {
        setError('Connection request was rejected');
      } else if (error.message?.includes('User rejected')) {
        setError('Connection request was rejected');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOwnership = async () => {
    if (!walletAddress) return;
    
    setError(null);
    setIsLoading(true);

    try {
      const { solana } = window as unknown as { 
        solana?: { 
          signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
        } 
      };

      // Create verification message
      const message = `I hereby claim ownership of pNode ${node.pubkey} on Xandeum Analytics Platform.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
      
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await solana!.signMessage(encodedMessage, 'utf8');
      
      // Convert signature to base58
      const bs58 = await import('bs58');
      const signature = bs58.default.encode(signedMessage.signature);

      // Submit claim to API
      const response = await fetch('/api/nodes/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.pubkey,
          walletAddress,
          signature,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify ownership');
      }

      setStep('customize');
    } catch (err) {
      console.error('Verification error:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCustomization = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/nodes/claim', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: node.pubkey,
          customName: customName || undefined,
          websiteUrl: websiteUrl || undefined,
          discordHandle: discordHandle || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save customization');
      }

      setStep('complete');
      onClaimed?.();
    } catch (err) {
      console.error('Customization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPubkey = async () => {
    await navigator.clipboard.writeText(node.pubkey);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Claim Your pNode
          </DialogTitle>
          <DialogDescription>
            Verify ownership to customize your node&apos;s display and access operator features.
          </DialogDescription>
        </DialogHeader>

        {/* Node Info */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Node ID</span>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono">{truncatePubkey(node.pubkey, 8)}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyPubkey}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant="outline" className={
              node.status === 'online' 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-red-500/10 text-red-500'
            }>
              {node.status}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Location</span>
            <span className="text-sm">{node.geoCity}, {node.geoCountry}</span>
          </div>
        </div>

        {/* Step: Connect Wallet */}
        {step === 'connect' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Connect your wallet to verify you own this pNode.
                Your wallet should match the node&apos;s identity keypair.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button className="w-full" onClick={handleConnectWallet} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Phantom Wallet
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step: Verify Ownership */}
        {step === 'verify' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Badge variant="outline" className="bg-green-500/10 text-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Wallet Connected
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono mb-2">
                {walletAddress}
              </p>
              <p className="text-sm text-muted-foreground">
                Sign a message to prove you control this wallet and own the pNode.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <Button className="w-full" onClick={handleVerifyOwnership} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Sign Message to Verify'
              )}
            </Button>
          </div>
        )}

        {/* Step: Customize */}
        {step === 'customize' && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-500">
                <Check className="h-3 w-3 mr-1" />
                Ownership Verified
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Display Name</label>
                <Input
                  placeholder="My Awesome pNode"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Website (optional)</label>
                <Input
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Discord Handle (optional)</label>
                <Input
                  placeholder="username#1234"
                  value={discordHandle}
                  onChange={(e) => setDiscordHandle(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('complete')}>
                Skip
              </Button>
              <Button className="flex-1" onClick={handleSaveCustomization} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Node Claimed Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                You can now access operator features and manage your node from the dashboard.
              </p>
            </div>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

