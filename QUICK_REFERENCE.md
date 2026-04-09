# Quick Reference Guide - Real-Time Sync

## 🚀 Start Server

```bash
npm run dev:sync
# Runs on http://localhost:3000 with WebSocket
```

## 🎯 Use in React Component

```tsx
import { useCollectionSync } from '@/hooks/useRealtimeSync';

// Fetch and auto-sync collection
const { items, isConnected, isLoading } = useCollectionSync('products');

// Manual subscription with callback
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

useRealtimeSync({
  collections: ['products'],
  onDataChange: (change) => {
    console.log('Changed:', change.operationType, change.documentId);
  },
});
```

## 📡 Update API Route

```typescript
import { broadcastChange } from '@/lib/broadcast-sync';

// After creating
const newProduct = await Product.create(data);
broadcastChange('products', 'insert', newProduct._id.toString(), newProduct.toObject());

// After updating
const updated = await Product.findByIdAndUpdate(id, data, { new: true });
broadcastChange('products', 'update', id, updated.toObject(), { updatedFields: data });

// After deleting
await Product.findByIdAndDelete(id);
broadcastChange('products', 'delete', id);
```

## 🖥️ Electron App Setup

```typescript
import { RealtimeSyncService } from './realtime-sync-service';

const syncService = new RealtimeSyncService();

// On app start
await syncService.connect('http://localhost:3000');

// Subscribe to collection
syncService.subscribe('products', (change) => {
  console.log(change.operationType, change.fullDocument || change.documentId);
});

// On app close
await syncService.disconnect();
```

## 📊 Data Change Event Structure

```typescript
{
  collectionName: 'products',
  timestamp: Date,
  operationType: 'insert' | 'update' | 'delete',
  documentId: string,
  fullDocument: { /* entire document for insert/update */ },
  updateDescription: {
    updatedFields: { /* only changed fields */ },
    removedFields: [] /* deleted fields */
  }
}
```

## ✅ Collections Being Monitored

```
products, orders, customers, suppliers, inventory,
employees, agents, vendors, estimates
```

## 🐛 Debug

```typescript
// Browser Console - Check connection
socket.on('data-change', (data) => console.log('Change:', data));

// Check if connected
fetch('/api/products').then(r => r.json()).then(console.log);

// Server Logs - Should show
// [products] Broadcasted insert: <id>
// [orders] Broadcasted update: <id>
```

## 🔧 Troubleshooting Quick Fix

| Issue | Fix |
|-------|-----|
| Connection refused | Use `npm run dev:sync` not `npm run dev` |
| Changes not syncing | Add `broadcastChange()` to API route |
| Port in use | `kill -9 $(lsof -t -i:3000)` |
| Module not found | `npm install socket.io express cors` |
| MongoDB error | Check `.env` MONGODB_URI |

## 📄 Important Files

| File | Purpose |
|------|---------|
| `server.ts` | Custom Next.js server with WebSocket |
| `src/lib/websocket-server.ts` | Socket.io + MongoDB Change Streams |
| `src/lib/realtime-sync-service.ts` | Electron app sync service |
| `src/lib/broadcast-sync.ts` | Helper for API routes |
| `src/hooks/useRealtimeSync.ts` | React hooks for sync |

## 🎓 Full Documentation

- **Setup & Usage**: `REALTIME_SYNC_SETUP.md`
- **Config & Troubleshooting**: `SYNC_CONFIGURATION.md`
- **API Example**: `API_ROUTE_EXAMPLE.ts`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
