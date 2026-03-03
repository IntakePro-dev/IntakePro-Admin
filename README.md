# IntakePro Admin Panel

Admin panel for managing IntakePro insurance clients, billing, and system configuration.

## Overview

This is a separate Next.js application that consumes APIs from the main IntakePro app. It provides platform administrators with tools to:

- Manage insurance clients and their configurations
- Configure AI integrations (ElevenLabs, Guidewire)
- Monitor billing and usage metrics
- View audit logs with hash chain verification
- Manage FNOL templates and delivery settings

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: TanStack React Query
- **Charts**: Recharts
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- Main IntakePro app running on port 3000

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Main IntakePro API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Admin Panel URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

The admin panel runs on port 3001 by default.

### Production Build

```bash
npm run build
npm run start
```

## Project Structure

```
src/
├── app/
│   ├── (admin)/           # Protected admin routes
│   │   ├── clients/       # Client management
│   │   ├── billing/       # Global billing
│   │   ├── usage-logs/    # Usage metrics
│   │   ├── audit-logs/    # Audit trail
│   │   └── settings/      # Admin settings
│   └── (auth)/            # Auth routes
│       └── login/         # Login page
├── components/
│   ├── layout/            # Layout components
│   ├── clients/           # Client-related components
│   ├── integrations/      # Integration sections
│   ├── billing/           # Billing components
│   └── ui/                # shadcn/ui components
├── hooks/                 # React Query hooks
├── lib/
│   ├── api/               # API client functions
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
└── contexts/              # React contexts
```

## Features

### Client Management
- Client list with search, sort, and filter
- 5-step client creation wizard
- Full-screen client settings modal
- User management (create, edit role, delete)

### Integrations
- FNOL template configuration
- ElevenLabs voice AI settings
- Guidewire ClaimCenter integration with OAuth2
- Email delivery configuration
- Phone integration settings

### Billing
- Per-client billing with Stripe integration
- Global billing overview with charts
- Invoice history and payment tracking
- CSV export functionality

### Monitoring
- Usage logs with activity feed
- Audit logs with hash chain verification
- NDJSON export for compliance

## Authentication

The admin panel uses token-based authentication:
1. Admin logs in with email/password
2. Token is stored in a cookie (`admin_token`)
3. Middleware validates token and PLATFORM_ADMIN role
4. Token is sent with all API requests

## Deployment

### Vercel

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Custom Domain

Configure DNS to point `admin.intakepro.ca` to your Vercel deployment.

## API Endpoints

The admin panel consumes the following API endpoints from the main IntakePro app:

- `POST /api/auth/login` - Admin login
- `GET /api/admin/me` - Get admin profile
- `GET /api/admin/clients` - List clients
- `POST /api/admin/clients` - Create client
- `GET /api/admin/clients/:id` - Get client details
- `PATCH /api/admin/clients/:id` - Update client
- `DELETE /api/admin/clients/:id` - Delete client
- `PUT /api/admin/clients/:id/integrations` - Update integrations
- `GET /api/admin/clients/:id/billing` - Get billing
- `GET /api/admin/billing/overview` - Global billing
- `GET /api/admin/usage/overview` - Usage metrics
- `GET /api/audit` - Audit logs
- `GET /api/audit/verify` - Verify hash chain

## License

Proprietary - IntakePro
