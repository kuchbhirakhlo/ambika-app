# Real-Time Sync - Configuration & Troubleshooting

## Quick Start Checklist

- [ ] MongoDB URI is set in `.env` file (check it's the cloud URL, not localhost)
- [ ] Run `npm install socket.io express cors` (already done)
- [ ] Run `npm install --save-dev ts-node` (already done)
- [ ] Start server with `npm run dev:sync` instead of `npm run dev`
- [ ] Import and use hooks in React components
- [ ] Update API routes to call `broadcastChange()`
- [ ] Connect Electron app to `http://localhost:3000`

## Environment Variables

Your `.env` file should contain:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=YourApp
MONGODB_DB=ambika
NODE_ENV=development
PORT=3000
```

## Running the Servers

### Development with Real-Time Sync

```bash
# Terminal 1: Start Next.js with WebSocket server
npm run dev:sync

# This will output:
# > Ready on http://localhost:3000
# > Real-time sync server running with Socket.io
```

### Production

```bash
# Build the app
npm run build

# Start with real-time sync enabled
npm start

# Alternative: Start with default Next.js server (no sync)
npm run start:next
```

## Updating Existing API Routes

### Step 1: Add Import
```typescript
import { broadcastChange } from '@/lib/broadcast-sync';
```

### Step 2: After Create/Update/Delete, Add Broadcast

**For CREATE (POST):**
```typescript
const newItem = await Model.create(data);
broadcastChange('collectionName', 'insert', newItem._id.toString(), newItem.toObject());
```

**For UPDATE (PUT):**
```typescript
const updatedItem = await Model.findByIdAndUpdate(id, data, { new: true });
broadcastChange('collectionName', 'update', id, updatedItem.toObject(), {
  updatedFields: data,
  removedFields: [],
});
```

**For DELETE:**
```typescript
await Model.findByIdAndDelete(id);
broadcastChange('collectionName', 'delete', id);
```

## Electron App Setup

### 1. Create Sync Service File

In your Electron project, create:
```typescript
// src/services/realtime-sync-service.ts
// Copy contents from: /src/lib/realtime-sync-service.ts
```

### 2. Main Process Integration

```typescript
// src/main.ts
import { RealtimeSyncService } from './services/realtime-sync-service';

const syncService = new RealtimeSyncService();

app.on('ready', async () => {
  // Connect to web app's sync server
  try {
    await syncService.connect('http://localhost:3000');
    console.log('✓ Sync service connected');
  } catch (error) {
    console.error('✗ Failed to connect to sync service:', error);
  }

  createWindow();
});

// Clean up on quit
app.on('will-quit', async () => {
  await syncService.disconnect();
});
```

### 3. Preload Script (Security)

```typescript
// src/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  onDataChange: (callback: (change: any) => void) => {
    ipcRenderer.on('data-change', (_, data) => callback(data));
  },
  subscribeToCollection: (collectionName: string) => {
    ipcRenderer.send('subscribe', collectionName);
  },
});
```

### 4. Renderer Process

```typescript
// src/renderer.ts
const { api } = window as any;

// Subscribe to changes
api.subscribeToCollection('products');

// Handle incoming changes
api.onDataChange((change: any) => {
  console.log('Data changed:', change);
  // Update your UI
});
```

## Testing the Sync

### Test 1: Manual MongoDB Insert

```bash
# In MongoDB Compass or mongosh:
db.products.insertOne({
  code: 'TEST001',
  name: 'Test Product',
  price: 99.99,
  category: 'Test',
  supplier: 'Test Supplier'
})
```

Both web and desktop apps should receive the change instantly.

### Test 2: API Route Test

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CURL001",
    "name": "Test via Curl",
    "price": 50,
    "category": "Test",
    "supplier": "Test"
  }'
```

### Test 3: React Component Test

```typescript
// Add to any page for testing
'use client';
import { useCollectionSync } from '@/hooks/useRealtimeSync';

export default function SyncTest() {
  const { items, isConnected, isLoading } = useCollectionSync('products');

  return (
    <div style={{ padding: '20px', border: '1px solid red' }}>
      <h2>Sync Test</h2>
      <p>Connected: {isConnected ? '✓ Yes' : '✗ No'}</p>
      <p>Loading: {isLoading ? '...' : 'Done'}</p>
      <p>Items: {items.length}</p>
      {items.slice(0, 3).map((item: any) => (
        <div key={item._id}>{item.name}</div>
      ))}
    </div>
  );
}
```

## Troubleshooting Guide

### Issue: "Cannot find module 'socket.io'"

**Solution:**
```bash
npm install socket.io
npm install --save-dev @types/node
```

### Issue: "Error: Socket.io server not initialized"

**Solution:**
- Make sure you're running `npm run dev:sync` (custom server)
- NOT `npm run dev` (default Next.js)
- The error occurs when `broadcastChange()` is called but Socket.io wasn't initialized

### Issue: Port 3000 Already in Use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev:sync
```

### Issue: Connection Refused in Browser

**Solution:**
1. Verify server is running: `http://localhost:3000` should load the app
2. Check browser console for errors
3. Verify `.env` file is loaded correctly:
   ```bash
   cat .env | grep MONGODB
   ```

### Issue: Changes Not Appearing in Real-Time

**Checklist:**
- [ ] Server running with `npm run dev:sync` ✓
- [ ] API route calls `broadcastChange()` after modification ✓
- [ ] Hook is using correct collection name ✓
- [ ] Check server logs for broadcast messages
- [ ] Check browser console for "Connected to real-time sync server"

**Debug Steps:**
```typescript
// In browser console:
// Check if Socket.io is loaded
console.log(typeof io !== 'undefined' ? 'Socket.io loaded' : 'Not loaded');

// Monitor all incoming messages
socket.on('data-change', (data) => {
  console.log('🔄 Received:', data);
});
```

### Issue: MongoDB Change Streams Not Working

**Possible Causes:**
1. MongoDB version < 3.6 (doesn't support Change Streams)
2. Not using a Replica Set (required for Change Streams)
   - MongoDB Atlas uses replica sets by default ✓
   - Local MongoDB may not have replica set enabled

**Solution for Local MongoDB:**
```bash
# Enable replica set (for local MongoDB)
mongod --replSet rs0

# Initialize replica set (in mongosh)
rs.initiate()
```

### Issue: Electron App Not Receiving Updates

**Checklist:**
1. Web app is running on `http://localhost:3000` ✓
2. Electron app is connecting to correct URL ✓
3. Collection names match exactly (case-sensitive) ✓
4. Electron has `socket.io-client` installed ✓

**Test Connection:**
```typescript
const syncService = new RealtimeSyncService();
await syncService.connect('http://localhost:3000');
console.log('Connected:', syncService.isConnected());
```

### Issue: High Memory Usage

**Solution:**
- Limit the number of subscribed collections
- Unsubscribe from collections when not needed
- Check for memory leaks in change handlers

```typescript
// Unsubscribe when component unmounts
useEffect(() => {
  return () => {
    syncService.unsubscribe('products', handleChange);
  };
}, []);
```

## Performance Optimization

### 1. Debounce Updates
```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((change) => {
  // Update UI
}, 300);
```

### 2. Filter Unnecessary Changes
```typescript
const handleChange = (change: DataChange) => {
  // Only process updates we care about
  if (change.operationType === 'update' && change.updateDescription) {
    const { updatedFields } = change.updateDescription;
    if (Object.keys(updatedFields).includes('price')) {
      // Only care about price changes
      updateUI(updatedFields.price);
    }
  }
};
```

### 3. Batch Changes
```typescript
// Instead of updating on every change, batch updates
const updates = new Map();

const batchUpdate = debounce(() => {
  // Apply all batched updates at once
  updates.forEach((value, key) => {
    updateItem(key, value);
  });
  updates.clear();
}, 500);
```

## Monitoring

### Check Socket.io Status
```typescript
const io = realtimeSyncServer.getIO();
console.log('Connected clients:', io?.engine.clientsCount);
```

### Monitor Changes in Browser
```typescript
// Paste in browser console to monitor all changes
socket.on('data-change', (data) => {
  console.table({
    Collection: data.collectionName,
    Operation: data.operationType,
    Time: new Date(data.timestamp).toLocaleTimeString(),
    DocumentId: data.documentId.substring(0, 8) + '...',
  });
});
```

### Server Logs
Look for messages like:
```
[products] Broadcasted insert: 60d5ec49c21d5a001f5e3c2a
[orders] Broadcasted update: 60d5ec49c21d5a001f5e3c2b
```
