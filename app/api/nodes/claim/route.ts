// Node Claim API Route
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST - Claim a node (uses wallet signature verification, not session auth)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, walletAddress, signature, message } = body;

    if (!nodeId || !walletAddress || !signature || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify signature (simplified - in production, verify against actual node identity)
    try {
      const bs58 = await import('bs58');
      const { PublicKey } = await import('@solana/web3.js');
      const nacl = await import('tweetnacl');

      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = bs58.default.decode(signature);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return NextResponse.json(
        { error: 'Signature verification failed' },
        { status: 401 }
      );
    }

    // In a real implementation, you would:
    // 1. Check if the walletAddress matches the node's identity pubkey
    // 2. Store the claim in the database
    // 3. Update the user's role to OPERATOR

    // For now, return success (mock implementation)
    return NextResponse.json({
      success: true,
      message: 'Node claimed successfully',
      data: {
        nodeId,
        walletAddress,
        claimedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json(
      { error: 'Failed to claim node' },
      { status: 500 }
    );
  }
}

// PATCH - Update node customization
export async function PATCH(request: NextRequest) {
  try {
    // Handle session fetch with dedicated error handling
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (authError) {
      console.error('Auth service error:', authError);
      return NextResponse.json(
        { error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { nodeId, customName, websiteUrl, discordHandle } = body;

    if (!nodeId) {
      return NextResponse.json(
        { error: 'Node ID is required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would update the database
    // For now, return success (mock implementation)
    return NextResponse.json({
      success: true,
      message: 'Node customization saved',
      data: {
        nodeId,
        customName,
        websiteUrl,
        discordHandle,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update node' },
      { status: 500 }
    );
  }
}

