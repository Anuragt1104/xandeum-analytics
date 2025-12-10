'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  User,
  LogOut,
  Settings,
  Server,
  Shield,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LoginModal } from './login-modal';

// Simple dropdown menu components (since we don't have @radix-ui/react-dropdown-menu)
function SimpleDropdown({ children, trigger }: { children: React.ReactNode; trigger: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-popover border border-border z-50">
            <div className="py-1" onClick={() => setIsOpen(false)}>
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function UserMenu() {
  const { data: session, status } = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (status === 'loading') {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  if (!session) {
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowLoginModal(true)}
        >
          <LogIn className="h-4 w-4 mr-2" />
          Sign In
        </Button>
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'OPERATOR': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <SimpleDropdown
      trigger={
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[100px] truncate">
            {session.user.name || session.user.email?.split('@')[0]}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      }
    >
      <div className="px-3 py-2">
        <p className="text-sm font-medium">
          {session.user.name || 'User'}
        </p>
        <p className="text-xs text-muted-foreground">
          {session.user.email || session.user.walletAddress?.slice(0, 12) + '...'}
        </p>
        <Badge 
          variant="outline" 
          className={`mt-1 text-[10px] ${getRoleBadgeColor(session.user.role)}`}
        >
          {session.user.role}
        </Badge>
      </div>
      
      <div className="h-px bg-border my-1" />
      
      {session.user.role === 'OPERATOR' || session.user.role === 'ADMIN' ? (
        <>
          <Link 
            href="/operator" 
            className="flex items-center px-3 py-2 text-sm hover:bg-accent"
          >
            <Server className="h-4 w-4 mr-2" />
            My Nodes
          </Link>
        </>
      ) : null}
      
      {session.user.role === 'ADMIN' && (
        <Link 
          href="/admin" 
          className="flex items-center px-3 py-2 text-sm hover:bg-accent"
        >
          <Shield className="h-4 w-4 mr-2" />
          Admin Panel
        </Link>
      )}
      
      <Link 
        href="/settings" 
        className="flex items-center px-3 py-2 text-sm hover:bg-accent"
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Link>
      
      <div className="h-px bg-border my-1" />
      
      <button 
        onClick={() => signOut()}
        className="flex items-center w-full px-3 py-2 text-sm text-red-500 hover:bg-accent"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </button>
    </SimpleDropdown>
  );
}

