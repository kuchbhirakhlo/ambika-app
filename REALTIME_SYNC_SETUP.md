# Real-Time MongoDB Sync Setup

This document explains how to set up and use real-time MongoDB synchronization between your Next.js web app and Electron desktop app.

## Architecture

The sync system uses:
- **MongoDB Change Streams**: Watches for database changes in real-time
- **Socket.io**: WebSocket server that broadcasts changes to all connected clients
- **Custom Server**: Next.js integration with Express/Socket.io server

## Web App (Next.js) Setup

### 1. Start with Real-Time Sync

Replace your normal `npm run dev` with the sync-enabled server:

```bash
npm run dev:sync
```

This starts the custom server at `http://localhost:3000` with Socket.io support.

### 2. Use in React Components

#### Option A: Using the `useRealtimeSync` hook

```tsx
import { useRealtimeSync, DataChange } from '@/hooks/useRealtimeSync';

export function MyComponent() {
  const { isConnected, error } = useRealtimeSync({
    collections: ['products', 'orders'],
    onDataChange: (change: DataChange) => {
      console.log('Data changed:', change);
      // Update UI based on change
    },
  });

  return (
    <div>
      {isConnected ? '✓ Connected' : '✗ Disconnected'}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

#### Option B: Using the `useCollectionSync` hook (Recommended)

```tsx
import { useCollectionSync } from '@/hooks/useRealtimeSync';

interface Product {
  _id: string;
  name: string;
  price: number;
  updatedAt: Date;
}

export function ProductList() {
  const {
    items: products,
    isLoading,
    isConnected,
    error,
    refetch,
  } = useCollectionSync<Product>('products');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Status: {isConnected ? 'Connected ✓' : 'Disconnected ✗'}</p>
      <button onClick={() => refetch()}>Refresh</button>
      <ul>
        {products.map((product) => (
          <li key={product._id}>
            {product.name} - ${product.price}
            <small>Updated: {product.updatedAt}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3. Update API Routes to Broadcast Changes

In your API routes (e.g., `/src/app/api/products/route.ts`), import and use the broadcast function:

```ts
import { broadcastChange } from '@/lib/broadcast-sync';
import { NextRequest, NextResponse } from 'next/server';

// POST new product
export async function POST(request: NextRequest) {
  try {
    // ... your creation logic ...
    const newProduct = await Product.create(data);

    // Broadcast to all connected clients
    broadcastChange(
      'products',
      'insert',
      newProduct._id.toString(),
      newProduct.toObject()
    );

    return NextResponse.json(
      { product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(request: NextRequest) {
  try {
    // ... your update logic ...
    const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true });

    // Broadcast update
    broadcastChange(
      'products',
      'update',
      id,
      updatedProduct.toObject(),
      {
        updatedFields: data,
        removedFields: [],
      }
    );

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    await Product.findByIdAndDelete(id);

    // Broadcast deletion
    broadcastChange('products', 'delete', id!);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
```

## Electron Desktop App Setup

### 1. Install Dependencies

```bash
npm install socket.io-client
```

### 2. Copy Sync Service

Copy the `src/lib/realtime-sync-service.ts` file from your web app to your Electron project.

### 3. Basic Usage

```typescript
import { RealtimeSyncService } from './realtime-sync-service';

// Initialize the sync service
const syncService = new RealtimeSyncService();

// Connect to the web server
await syncService.connect('http://localhost:3000');

// Subscribe to product changes
syncService.subscribe('products', (change) => {
  console.log('Product changed:', change);

  switch (change.operationType) {
    case 'insert':
      console.log('New product:', change.fullDocument);
      // Update your local database or UI
      break;

    case 'update':
      console.log('Updated fields:', change.updateDescription?.updatedFields);
      // Update your local state
      break;

    case 'delete':
      console.log('Deleted product:', change.documentId);
      // Remove from your local state
      break;
  }
});

// Subscribe to multiple collections
syncService.subscribe('orders', (change) => {
  console.log('Order changed:', change);
});

// Disconnect when done
await syncService.disconnect();
```

### 4. Listen to All Changes

```typescript
// Listen to changes from any collection
syncService.onAnyChange((change) => {
  console.log(`${change.collectionName} changed:`, change);
  // Update UI or local state
});

// Stop listening
syncService.offAnyChange(callback);
```

### 5. Electron Window Integration

```typescript
import { ipcMain } from 'electron';
import { RealtimeSyncService } from './services/realtime-sync-service';

const syncService = new RealtimeSyncService();

// Connect to sync server when app starts
app.on('ready', async () => {
  try {
    await syncService.connect('http://localhost:3000');
    console.log('Connected to sync server');
  } catch (error) {
    console.error('Failed to connect to sync server:', error);
  }

  createWindow();
});

// Subscribe from IPC
ipcMain.on('subscribe-to-collection', (event, collectionName) => {
  syncService.subscribe(collectionName, (change) => {
    event.sender.send('data-changed', change);
  });
});

// Handle app quit
app.on('will-quit', async () => {
  await syncService.disconnect();
});
```

### 6. Electron Renderer Process

```typescript
import { ipcRenderer } from 'electron';

// Subscribe to changes
ipcRenderer.send('subscribe-to-collection', 'products');

ipcRenderer.on('data-changed', (event, change) => {
  console.log('Data changed:', change);

  // Update your Vue/React component state
  switch (change.operationType) {
    case 'insert':
      // Add new item
      break;
    case 'update':
      // Update existing item
      break;
    case 'delete':
      // Remove item
      break;
  }
});
```

## Running Both Apps in Sync

### Terminal 1: Start Web App with Real-Time Sync
```bash
cd /path/to/web-app
npm run dev:sync
```

### Terminal 2: Start Electron App
```bash
cd /path/to/electron-app
npm start
```

Now both apps will automatically sync any changes to MongoDB in real-time!

## Collections Available for Sync

The following collections are automatically watched:

- `products`
- `orders`
- `customers`
- `suppliers`
- `inventory`
- `employees`
- `agents`
- `vendors`
- `estimates`

To add more collections, update the `COLLECTIONS` array in `/src/lib/websocket-server.ts`.

## Monitoring Changes

### Web Browser Console
```typescript
// In browser console, check connection status
window.location.hostname === 'localhost' && 
  console.log('Server should be running at http://localhost:3000');
```

### Check Logs
The console will show:
```
Connected to real-time sync server
[products] Broadcasted insert: 60d5ec49c21d5a001f5e3c2a
[orders] Broadcasted update: 60d5ec49c21d5a001f5e3c2b
[customers] Broadcasted delete: 60d5ec49c21d5a001f5e3c2c
```

## Troubleshooting

### Connection Refused
- Make sure web app is running with `npm run dev:sync` (not `npm run dev`)
- Check MongoDB URI in `.env` file
- Verify MongoDB is running and accessible

### Changes Not Syncing
- Check browser console for connection status
- Verify collection names match exactly
- Check server logs for change stream errors
- Ensure API routes call `broadcastChange()` after modifications

### Performance Issues
- Monitor Socket.io connections: `http://localhost:3000/socket.io/?EIO=4&transport=polling`
- Consider debouncing rapid changes in the frontend
- Check MongoDB connection pool settings

## Advanced Configuration

### Custom WebSocket Events

Add custom events to the sync service:

```typescript
// In websocket-server.ts
socket.on('custom-event', (data) => {
  // Handle custom event
  io.emit('custom-response', data);
});
```

### Authentication

Add authentication to WebSocket connections:

```typescript
const io = new SocketIOServer(httpServer, {
  auth: {
    token: process.env.SOCKET_AUTH_TOKEN,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Verify token
  next();
});
```

### Change Stream Options

Modify change stream behavior in `websocket-server.ts`:

```typescript
const changeStream = collection.watch([], {
  fullDocument: 'updateLookup', // 'off', 'updateLookup'
  resumeAfter: null,
  operationTypes: ['insert', 'update', 'delete'], // Filter operations
});
```
