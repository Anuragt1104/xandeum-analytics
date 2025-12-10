'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  User,
  LogOut,
  Settings,
  Server,
  Shield,
  ChevronDown,
  LogIn,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoginModal } from './login-modal';
import { useSession } from './session-provider';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

// Animated dropdown menu
function AnimatedDropdown({ 
  children, 
  trigger,
  isOpen,
  onToggle 
}: { 
  children: React.ReactNode; 
  trigger: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <div onClick={onToggle}>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              className="fixed inset-0 z-40" 
              onClick={onToggle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div 
              className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-card/95 backdrop-blur-xl border border-border/50 z-50 overflow-hidden"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              {/* Gradient accent */}
              <div className="h-0.5 bg-gradient-to-r from-primary via-cyan-400 to-purple-500" />
              <div className="py-1" onClick={onToggle}>
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export function UserMenu() {
  const session = useSession();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      window.location.reload();
    } else {
      // NextAuth signout
      const { signOut } = await import('next-auth/react');
      await signOut();
    }
  };

  if (session.isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  if (!session.isAuthenticated || !session.user) {
    return (
      <>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => setShowLoginModal(true)}
            className="gap-2 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        </motion.div>
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    );
  }

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'OPERATOR': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default: return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <>
      <AnimatedDropdown
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        trigger={
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
              <div className="relative">
                <User className="h-4 w-4" />
                {/* Online indicator */}
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500 border border-background" />
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate font-medium">
                {session.user.name || session.user.email?.split('@')[0] || 'User'}
              </span>
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-3 w-3 opacity-50" />
              </motion.div>
            </Button>
          </motion.div>
        }
      >
        {/* User info */}
        <div className="px-3 py-3 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session.user.email || 'No email'}
              </p>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`mt-2 text-[10px] ${getRoleBadgeColor(session.user.role)}`}
          >
            <Sparkles className="h-2.5 w-2.5 mr-1" />
            {session.user.role || 'USER'}
          </Badge>
        </div>
        
        <div className="h-px bg-border/50" />
        
        {/* Navigation items */}
        <div className="py-1">
          {(session.user.role === 'OPERATOR' || session.user.role === 'ADMIN') && (
            <Link 
              href="/operator" 
              className="flex items-center px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <Server className="h-4 w-4 mr-2 text-muted-foreground" />
              My Nodes
            </Link>
          )}
          
          {session.user.role === 'ADMIN' && (
            <Link 
              href="/admin" 
              className="flex items-center px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
            >
              <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
              Admin Panel
            </Link>
          )}
          
          <Link 
            href="/settings" 
            className="flex items-center px-3 py-2 text-sm hover:bg-muted/50 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
            Settings
          </Link>
        </div>
        
        <div className="h-px bg-border/50" />
        
        {/* Sign out */}
        <div className="py-1">
          <button 
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </button>
        </div>
      </AnimatedDropdown>
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </>
  );
}
