'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Database, Github, Twitter, MessageCircle, Menu, X, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/user-menu';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-none">Xandeum</span>
              <span className="text-xs text-muted-foreground leading-none">
                pNode Analytics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="https://docs.xandeum.network"
              target="_blank"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              href="https://www.xandeum.network"
              target="_blank"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Xandeum
            </Link>
          </nav>

          {/* Social Links, Tools & Auth */}
          <div className="flex items-center gap-2">
            {/* Tools Link */}
            <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
              <Link href="/tools">
                <Wrench className="h-4 w-4 mr-1" />
                Tools
              </Link>
            </Button>

            <div className="hidden sm:flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href="https://github.com/xandeum"
                  target="_blank"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href="https://twitter.com/XandeumNetwork"
                  target="_blank"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href="https://discord.gg/uqRSmmM5m"
                  target="_blank"
                  aria-label="Discord"
                >
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className="text-sm font-medium text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="https://docs.xandeum.network"
                target="_blank"
                className="text-sm font-medium text-muted-foreground"
              >
                Documentation
              </Link>
              <Link
                href="https://www.xandeum.network"
                target="_blank"
                className="text-sm font-medium text-muted-foreground"
              >
                Xandeum Website
              </Link>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://github.com/xandeum" target="_blank">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="https://discord.gg/uqRSmmM5m" target="_blank">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Discord
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
