# Sync Configuration

## Current Configuration

### Dependencies Installed ✅
- [x] `socket.io`: WebSocket server library
- [x] `socket.io-client`: WebSocket client library
- [x] `@types/socket.io-client`: TypeScript types

### Server Configuration ✅
- [x] Socket.IO server initialized in `server.ts`
- [x] MongoDB Change Streams watching all collections
- [x] CORS configured for localhost origins

### Client Configuration ✅
- [x] `useRealtimeSync` hook for Next.js components
- [x] `RealtimeSyncService` for Electron app compatibility
- [x] Automatic reconnection and error handling

### API Routes ✅
- [x] `broadcastChange()` calls added to all CRUD operations
- [x] Supports insert, update, delete operations
- [x] Real-time broadcasting to all connected clients

## Collections Monitored

The following MongoDB collections are monitored for changes:
- `products` - Product catalog
- `customers` - Customer information
- `orders` - Order management
- `suppliers` - Supplier details
- `inventory` - Inventory tracking
- `employees` - Employee records
- `agents` - Agent information
- `vendors` - Vendor management
- `estimates` - Estimate/quotation system

## Connection Settings

### Socket.IO Server
```javascript
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:*'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});
```

### Client Connection
```javascript
const socket = io(window.location.origin, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

## Development Commands

```bash
# Start with sync enabled
npm run dev:sync

# Start production server
npm run start:prod
```

## Diagnostic Information

### Server Status
- Socket.IO server: ✅ Running
- MongoDB connection: ✅ Connected
- Change streams: ✅ Active for all collections

### Client Status
- Next.js app: ✅ Connected
- Electron app: ✅ Ready for connection

### Network
- WebSocket port: 3000
- CORS: ✅ Configured
- Transports: WebSocket, Polling

## Testing Checklist

- [x] Server starts with Socket.IO
- [x] MongoDB Change Streams active
- [x] Client connections established
- [x] Data changes broadcasted
- [x] Real-time updates received
- [x] Cross-app synchronization working

## Performance Considerations

- Change Streams may add load to MongoDB
- WebSocket connections maintained for real-time updates
- Automatic cleanup on server shutdown
- Reconnection handling for network issues