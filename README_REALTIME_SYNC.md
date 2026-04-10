# Real-time Sync Setup Guide

This application uses MongoDB Change Streams and Socket.IO to provide real-time synchronization between multiple applications (Electron.js desktop app and Next.js web app) that share the same MongoDB database.

## How Real-time Sync Works

1. **MongoDB Change Streams**: The server watches for changes in MongoDB collections using Change Streams
2. **Socket.IO Server**: Changes are broadcasted to all connected clients via WebSocket connections
3. **Client Synchronization**: Both Electron and Next.js apps receive real-time updates and update their UI accordingly

## Architecture

```
MongoDB Collections
    ↓ (Change Streams)
WebSocket Server (Socket.IO)
    ↓ (Broadcast)
Electron App ← → Next.js Web App
```

## Supported Collections

The following collections are monitored for real-time updates:
- products
- customers
- orders
- suppliers
- inventory
- employees
- agents
- vendors
- estimates

## Client Usage

### Next.js Web App (React Hooks)

```typescript
import { useRealtimeSync, useCollectionSync } from '@/hooks/useRealtimeSync';

// Listen to specific collection changes
const { items: products, isLoading, isConnected } = useCollectionSync('products');

// Or use the lower-level hook
useRealtimeSync({
  collections: ['products', 'customers'],
  onDataChange: (change) => {
    console.log('Data changed:', change);
  }
});
```

### Electron Desktop App

```typescript
import { RealtimeSyncService } from './realtime-sync-service';

const syncService = new RealtimeSyncService();

// Connect to the server
await syncService.connect('http://localhost:3000');

// Subscribe to collection changes
syncService.subscribe('products', (change) => {
  console.log('Product changed:', change);
  // Update your Electron app UI
});
```

## API Routes

All API routes automatically broadcast changes when data is created, updated, or deleted. The `broadcastChange` function is called in each route handler.

## Server Setup

The server automatically:
1. Initializes Socket.IO server
2. Sets up MongoDB Change Streams for all collections
3. Broadcasts changes to connected clients

## Connection Management

- Automatic reconnection on connection loss
- CORS configured for localhost origins
- Support for both WebSocket and polling transports

## Development

Run with sync enabled:
```bash
npm run dev:sync
```

This starts the Next.js development server with Socket.IO integration.