# Xandeum pNode Analytics Platform (XPAP)

Real-time analytics dashboard for Xandeum pNodes - the decentralized storage layer for Solana. Monitor network health, node performance, and storage metrics.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=XPAP+Dashboard)

## Features

### Core Dashboard
- **Real-time Network Stats** - Total nodes, active nodes, storage capacity, average SRI
- **Node Leaderboard** - Sortable table with SRI, uptime, latency, storage, and status
- **Search & Filters** - Find nodes by pubkey, location, status, or version
- **Responsive Design** - Works on desktop and mobile devices

### Visualizations
- **World Map** - Geographic distribution of pNodes with Leaflet.js
- **Network Topology** - Interactive force-directed graph showing node connections (d3.js)
- **Performance Charts** - Historical metrics with Recharts
- **Availability Heatmap** - 24h uptime visualization per minute

### Operator Tools
- **Port Checker** - Verify pRPC (6000) and Gossip (9001) port accessibility
- **Claim My Node** - Wallet-based ownership verification
- **Operator Dashboard** - Private view of claimed nodes with alerts

### Authentication
- Email/password registration and login
- Solana wallet authentication (Phantom)
- Role-based access (User, Operator, Admin)

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Supabase compatible)
- **Auth**: NextAuth.js with credentials + wallet providers
- **Charts**: Recharts, D3.js, Leaflet.js
- **Wallet**: Solana Wallet Adapter

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or Supabase account)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/xandeum-analytics.git
cd xandeum-analytics

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Run database migrations (optional - for production)
npx prisma db push

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following:

```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/xandeum_analytics"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Xandeum Network
USE_MOCK_DATA="true"  # Set to "false" for real network
XANDEUM_SEED_NODES="173.212.220.65"  # Comma-separated IPs

# Optional: OAuth providers
GITHUB_ID=""
GITHUB_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## API Endpoints

### Public Endpoints

- `GET /api/pnodes` - List all pNodes with stats
- `GET /api/stats` - Network-wide statistics
- `POST /api/port-check` - Check if pNode ports are accessible

### Authenticated Endpoints

- `POST /api/auth/register` - Create new user account
- `GET /api/auth/session` - Get current session
- `POST /api/nodes/claim` - Claim ownership of a pNode
- `PATCH /api/nodes/claim` - Update claimed node customization

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  Dashboard  │  World Map  │  Topology  │  Node Details     │
│  Stats      │  (Leaflet)  │  (D3.js)   │  Charts           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  /api/pnodes  │  /api/auth  │  /api/port-check  │  ...     │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │  Xandeum pRPC   │  │  IP Geolocation │
│   (Prisma)      │  │  (Port 6000)    │  │  API            │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## pRPC Interface

The platform communicates with pNodes via JSON-RPC 2.0 on port 6000:

| Method | Description |
|--------|-------------|
| `get_pods` | List all known pNodes in gossip network |
| `get_stats` | Node telemetry (uptime, storage, peers) |
| `get_version` | Software version string |

## Storage Reliability Index (SRI)

SRI is a weighted score (0-100) calculated as:
- **RPC Availability (40%)**: Success rate of API calls over 24h
- **Gossip Visibility (30%)**: Frequency of appearance in peer lists
- **Version Compliance (30%)**: Running latest software release

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/xandeum-analytics)

1. Connect your GitHub repository
2. Add environment variables
3. Deploy

### Docker

```bash
# Build image
docker build -t xandeum-analytics .

# Run container
docker run -p 3000:3000 --env-file .env xandeum-analytics
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Xandeum Network](https://www.xandeum.network)
- [Documentation](https://docs.xandeum.network)
- [Discord Community](https://discord.gg/uqRSmmM5m)
- [GitHub](https://github.com/xandeum)

---

Built with ❤️ for the Xandeum community
