'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Settings,
  User,
  Bell,
  Shield,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Settings className="h-7 w-7" />
          Settings
        </h1>
      </div>

      {/* Profile Card */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Name</span>
            <span>{session.user.name || 'Not set'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{session.user.email || 'Not set'}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">{session.user.role}</Badge>
          </div>
          {session.user.walletAddress && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Wallet</span>
                <code className="text-xs">
                  {session.user.walletAddress.slice(0, 8)}...{session.user.walletAddress.slice(-8)}
                </code>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Notification settings will be available in a future update.
          </p>
          <Button variant="outline" disabled>
            Configure Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Change Password</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Update your account password.
            </p>
            <Button variant="outline" disabled>
              Change Password
            </Button>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium mb-1">Connected Wallet</h4>
            <p className="text-sm text-muted-foreground mb-2">
              {session.user.walletAddress 
                ? 'Your Solana wallet is connected.' 
                : 'Connect a Solana wallet to claim pNodes.'
              }
            </p>
            <Button variant="outline" disabled={!!session.user.walletAddress}>
              <Wallet className="h-4 w-4 mr-2" />
              {session.user.walletAddress ? 'Wallet Connected' : 'Connect Wallet'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-card/50 backdrop-blur border-red-500/20">
        <CardHeader>
          <CardTitle className="text-lg text-red-500">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data.
          </p>
          <Button variant="destructive" disabled>
            Delete Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

