# PWA Easy Rental

A monorepo-based micro-frontend architecture for a rental management platform, built with Next.js, TypeScript, and Tailwind CSS.

## Architecture

```
pwa-easy-rental/
├── apps/
│   ├── container-shell/     # Host micro-frontend (port 3000)
│   ├── mfe-client/          # Client PWA micro-frontend (port 3001)
│   ├── mfe-agency/          # Agency PWA micro-frontend (port 3002)
│   └── mfe-organisation/    # Organisation PWA micro-frontend (port 3003)
├── packages/
│   ├── shared-ui/           # Shared UI components with Tailwind CSS
│   └── shared-services/     # Shared services including centralized offline sync
├── turbo.json               # Turborepo configuration
├── package.json             # Root package.json with workspaces
└── tsconfig.json            # Root TypeScript configuration
```

## Features

- ✅ **Turborepo** - Fast builds with intelligent caching
- ✅ **Next.js 14** - Modern React framework with App Router
- ✅ **TypeScript** - Full type safety across all packages
- ✅ **Tailwind CSS** - Consistent styling with shared design tokens
- ✅ **PWA Support** - Each micro-frontend can be installed as a standalone PWA
- ✅ **Centralized Offline Sync** - Shared offline-first data synchronization

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run a specific app
npm run dev --filter=@pwa-easy-rental/container-shell
npm run dev --filter=@pwa-easy-rental/mfe-client
npm run dev --filter=@pwa-easy-rental/mfe-agency
npm run dev --filter=@pwa-easy-rental/mfe-organisation
```

### Build

```bash
# Build all apps and packages
npm run build
```

### Linting

```bash
# Lint all apps and packages
npm run lint
```

## Apps

### Container Shell (Host)
The main entry point that orchestrates all micro-frontends. Runs on port 3000 and provides:
- Navigation between micro-frontends
- Offline status indicator
- PWA manifest

### MFE Client
Client-facing portal for browsing and booking rentals. Features:
- Browse available rentals
- Make bookings with offline support
- Search functionality

### MFE Agency
Agency dashboard for managing listings and bookings. Features:
- Create and manage listings
- View and manage bookings
- Revenue tracking

### MFE Organisation
Organisation hub for overseeing multiple agencies. Features:
- Agency management
- Analytics dashboard
- System settings

## Packages

### shared-ui
Reusable UI components including:
- Button
- Card
- Input
- LoadingSpinner

### shared-services
Centralized services including:
- **OfflineSyncManager** - IndexedDB-based offline sync queue
- **useOfflineSync** - React hook for offline sync functionality
- **ApiClient** - HTTP client for API requests

## Offline Sync

The centralized offline sync logic in `@pwa-easy-rental/shared-services` provides:

1. **Sync Queue** - Operations are queued when offline and synced when online
2. **IndexedDB Storage** - Persistent local storage for offline data
3. **Auto-retry** - Failed syncs are automatically retried
4. **Cache Management** - Data caching for offline access

### Usage

```typescript
import { useOfflineSync } from '@pwa-easy-rental/shared-services';

function MyComponent() {
  const { isOnline, addToQueue, cacheData, getCachedData } = useOfflineSync();

  // Add operation to sync queue
  await addToQueue({
    type: 'CREATE',
    entity: 'booking',
    data: { /* ... */ },
  });

  // Cache data for offline access
  await cacheData('key', 'entity', data);

  // Get cached data
  const cached = await getCachedData('key');
}
```

## License

MIT