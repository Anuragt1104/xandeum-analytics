'use client';

import Link from 'next/link';
import { ArrowLeft, Wrench, Network, Server, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortChecker } from '@/components/tools/port-checker';

export default function ToolsPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <Wrench className="h-7 w-7" />
          Operator Tools
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Diagnostic tools to help you set up and maintain your Xandeum pNode.
        </p>
      </div>

      {/* Port Checker */}
      <PortChecker />

      {/* Other Tools */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5" />
              Node Setup Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Step-by-step instructions for setting up a new pNode on the Xandeum network.
            </p>
            <Button variant="outline" asChild>
              <Link href="https://docs.xandeum.network/deep-south/manual-pnode-setup" target="_blank">
                View Guide
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Check the overall health and status of the Xandeum DevNet network.
            </p>
            <Button variant="outline" asChild>
              <Link href="/">
                View Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* FAQ */}
      <Card className="bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg">Common Issues</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Port 6000 is showing as closed</h4>
            <p className="text-sm text-muted-foreground">
              Make sure your firewall allows incoming TCP connections on port 6000. 
              If using UFW, run: <code className="bg-muted px-1 rounded">sudo ufw allow 6000/tcp</code>
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Node not appearing in gossip network</h4>
            <p className="text-sm text-muted-foreground">
              Check that port 9001 (UDP) is open and your node is properly configured 
              to connect to seed nodes. Verify your pNode logs for connection errors.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Low SRI score</h4>
            <p className="text-sm text-muted-foreground">
              SRI is calculated from RPC availability (40%), gossip visibility (30%), 
              and version compliance (30%). Ensure your node is running the latest 
              software version and maintains high uptime.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">Need more help?</h4>
            <p className="text-sm text-muted-foreground">
              Join the Xandeum Discord community for support from other node operators 
              and the core team.{' '}
              <Link 
                href="https://discord.gg/uqRSmmM5m" 
                target="_blank"
                className="text-primary hover:underline"
              >
                Join Discord
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

