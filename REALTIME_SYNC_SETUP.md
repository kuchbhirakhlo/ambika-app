# Real-time Sync Setup Instructions

## Prerequisites

- MongoDB database (local or cloud)
- Node.js 18+
- Both Electron and Next.js applications

## Installation

1. Install dependencies:
```bash
npm install socket.io socket.io-client @types/socket.io-client
```

2. Environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/your-database
PORT=3000
```

## Quick Start

1. **Start the Next.js server with sync:**
```bash
npm run dev:sync
```

2. **In your Electron app, connect to sync:**
```javascript
import { RealtimeSyncService } from './realtime-sync-service';

const syncService = new RealtimeSyncService();
await syncService.connect('http://localhost:3000');
```

3. **In your Next.js components:**
```javascript
import { useCollectionSync } from '@/hooks/useRealtimeSync';

const { items, isConnected } = useCollectionSync('products');
```

## API Integration

All your API routes need to call `broadcastChange()` after database operations:

```javascript
import { broadcastChange } from '@/lib/broadcast-sync';

// After creating
const newItem = await Model.create(data);
broadcastChange('collectionName', 'insert', newItem._id.toString(), newItem.toObject());

// After updating
const updatedItem = await Model.findByIdAndUpdate(id, data, { new: true });
broadcastChange('collectionName', 'update', updatedItem._id.toString(), updatedItem.toObject());

// After deleting
await Model.findByIdAndDelete(id);
broadcastChange('collectionName', 'delete', id);
```

## Testing Sync

1. Open both Electron app and Next.js web app
2. Make changes in one app (create, update, delete)
3. Verify the changes appear in the other app immediately

## Troubleshooting

### Connection Issues
- Check MongoDB connection
- Verify Socket.IO server is running
- Check CORS settings

### Sync Not Working
- Ensure `broadcastChange()` is called in all API routes
- Check browser console for WebSocket errors
- Verify collection names match between client and server

### Performance
- Change Streams may impact MongoDB performance
- Consider filtering collections if not all need real-time sync