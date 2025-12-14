'use client';

import Link from 'next/link';
import { Github, Twitter, MessageCircle, Heart } from 'lucide-react';
import { XandeumLogo } from '@/components/ui/xandeum-logo';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-card/30 backdrop-blur mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <XandeumLogo size="md" animated={false} showText={true} />
            </Link>
            <p className="text-sm text-muted-foreground">
              Real-time analytics platform for Xandeum pNodes, the decentralized
              storage layer for Solana.
            </p>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://docs.xandeum.network"
                  target="_blank"
                  className="hover:text-foreground transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="https://pnodes.xandeum.network"
                  target="_blank"
                  className="hover:text-foreground transition-colors"
                >
                  pNode Setup Guide
                </Link>
              </li>
              <li>
                <Link
                  href="https://xandeum.github.io/xandeum-web3.js/"
                  target="_blank"
                  className="hover:text-foreground transition-colors"
                >
                  Web3.js SDK
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="font-semibold">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://discord.gg/uqRSmmM5m"
                  target="_blank"
                  className="hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Discord
                </Link>
              </li>
              <li>
                <Link
                  href="https://twitter.com/XandeumNetwork"
                  target="_blank"
                  className="hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Twitter className="h-4 w-4" />
                  Twitter
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/xandeum"
                  target="_blank"
                  className="hover:text-foreground transition-colors flex items-center gap-2"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          {/* Network */}
          <div className="space-y-4">
            <h4 className="font-semibold">Network</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="https://www.xandeum.network"
                  target="_blank"
                  className="hover:text-foreground transition-colors"
                >
                  Xandeum Website
                </Link>
              </li>
              <li>
                <Link
                  href="https://pnodestore.xandeum.network"
                  target="_blank"
                  className="hover:text-foreground transition-colors"
                >
                  pNode Store
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground/50">
                  DevNet Phase: Deep South Era
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Xandeum pNode Analytics. Open source project.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-red-500" /> for the Xandeum community
          </p>
        </div>
      </div>
    </footer>
  );
}
