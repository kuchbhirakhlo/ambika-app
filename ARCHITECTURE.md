# Architecture & Data Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     MONGODB DATABASE                            │
│                  (Local or MongoDB Atlas)                       │
│  Replica Set Required (for Change Streams support)             │
└────┬────────────────────────────────────────────────────────────┘
     │
     │ Change Stream API
     │ (Detects: insert, update, delete)
     │
┌────▼────────────────────────────────────────────────────────────┐
│         WEBSOCKET SERVER (Socket.io)                           │
│         ├─ src/lib/websocket-server.ts                         │
│         ├─ Listens to MongoDB Change Streams                   │
│         └─ Broadcasts changes to all connected clients         │
└────┬─────────┬──────────────────┬───────────────────────────────┘
     │         │                  │
     │         │                  │
┌────▼──┐  ┌──▼────┐         ┌───▼─────┐
│ WEB   │  │ MOBILE│         │ DESKTOP │
│ APP   │  │ SITE  │         │ (ELECTRON)
│(React)   │(PWA)  │         │         │
└────────────────────┘         │         │
                               └─────────┘

All connected via Socket.io WebSockets
```

## Data Flow: Creating a Product

```
USER IN WEB APP
      │
      ▼
  Submit Form
      │
      ▼
API Route POST /api/products
      │
      ├─ 1. Save to MongoDB
      │  └─ await Product.create(data)
      │
      ├─ 2. Broadcast Change
      │  └─ broadcastChange('products', 'insert', id, data)
      │
      └─ 3. Return Response to User
         └─ NextResponse.json({...})


AT THE SAME TIME:
MongoDB detects insert │
      │                │
      ▼                ▼
Change Stream    broadcastChange()
      │                │
      └────────┬───────┘
               │
               ▼
        Socket.io Broadcast
               │
     ┌─────────┼─────────┐
     │         │         │
     ▼         ▼         ▼
  WEB APP  MOBILE    ELECTRON
  (React)  (PWA)     (Desktop)
     │         │         │
     └─────────┼─────────┘
               │
               ▼
      Update UI in Real-Time ✨
```

## Component Data Flow

```
React Component
├─ import { useCollectionSync } from '@/hooks/useRealtimeSync'
│
├─ const { items, isConnected } = useCollectionSync('products')
│  │
│  ├─ Hook connects to WebSocket
│  ├─ Fetches initial data via API
│  └─ Listens for 'data-change' events
│
└─ When data changes:
   ├─ INSERT  → Add to beginning of items array
   ├─ UPDATE  → Update matching item in array
   └─ DELETE  → Remove from array
   
   → React re-renders automatically ✨
```

## API Route with Broadcast

```
export async function POST(request: NextRequest) {
  try {
    // 1. Connect to MongoDB
    await connectMongo();
    
    // 2. Get request data
    const data = await request.json();
    
    // 3. Save to database
    const newProduct = await Product.create(data);
    
    // 4. 🔴 CRUCIAL: Broadcast to all clients
    broadcastChange(
      'products',          ← Collection name
      'insert',            ← Operation type
      newProduct._id.toString(),  ← Document ID
      newProduct.toObject() ← Full document data
    );
    
    // 5. Return to user
    return NextResponse.json({ product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: '...' }, { status: 500 });
  }
}

⚠️  Without step 4, changes won't sync!
```

## Electron App Connection

```
Electron Main Process
│
├─ 1. Import service
│  └─ import { RealtimeSyncService }...
│
├─ 2. Create instance
│  └─ const syncService = new RealtimeSyncService()
│
├─ 3. Connect when app ready
│  └─ await syncService.connect('http://localhost:3000')
│
└─ 4. Subscribe to collections
   ├─ syncService.subscribe('products', (change) => {...})
   ├─ syncService.subscribe('orders', (change) => {...})
   └─ etc.
      │
      ▼
   Using IPC, send to Renderer
      │
      ▼
   Electron Renderer (Vue/React/Svelte)
      │
      ▼
   Update UI in Real-Time
```

## Sync Process Timeline

```
TIME    WEB APP              MONGODB          ELECTRON APP        MOBILE APP
│
├─ 0ms  Create product form                    
│       (user typing)
│
├─ 100ms POST /api/products
│        │
│        ├─ Validation ✓
│        └─ Save to DB
│
├─ 102ms Update MongoDB
│        │
│        └─ Trigger Change Stream
│
├─ 103ms broadcastChange()
│        └─ Emit via Socket.io
│
├─ 105ms Web app receives    Listen on         Receive           Receive
│        data-change event    stream            data-change       data-change
│        │                    emit change      event              event
│        │                    event            │                  │
├─ 106ms Update UI            │               Update UI          Update UI
│        ✓ Appears            │               ✓ Appears          ✓ Appears
│
│
└─ Total latency: ~6ms (sub-10ms experience)
```

## File Relationships

```
package.json
│
├─ npm run dev:sync
│  └──> server.ts
│       └──> src/lib/websocket-server.ts (Change Streams + Socket.io)
│
├─ React Components
│  └──> src/hooks/useRealtimeSync.ts
│       └──> Socket.io Client
│            └──> Connects to server.ts
│
├─ API Routes
│  └──> src/app/api/*/route.ts
│       └──> src/lib/broadcast-sync.ts
│            └──> Calls realtimeSyncServer.getIO()
│
└─ Electron App
   └──> src/lib/realtime-sync-service.ts
        └──> Socket.io Client
             └──> Connects to server.ts
```

## Collection Watching

```
Server starts with: npm run dev:sync
│
└─ realtimeSyncServer.watchAllCollections()
   │
   └─ For each collection:
      ├─ products
      │  └─ collection.watch() → Listen for changes
      │     │
      │     └─ On change → Emit via Socket.io
      │
      ├─ orders
      │  └─ collection.watch() → Listen for changes
      │     │
      │     └─ On change → Emit via Socket.io
      │
      ├─ customers
      ├─ suppliers
      ├─ inventory
      ├─ employees
      ├─ agents
      ├─ vendors
      └─ estimates
         └─ [All continuously monitored]

Clients subscribe to:
├─ socket.emit('subscribe', 'products')
├─ socket.emit('subscribe', 'orders')
└─ socket.emit('subscribe', 'customers')
   │
   └─ Receive events for those collections only
```

## Error Recovery Flow

```
Initial Connection
    │
    ├─ ✓ Connected → Listen to changes
    │
    └─ ✗ Failed → Retry with exponential backoff
       │
       ├─ Wait 1s → Retry 1
       ├─ Wait 2s → Retry 2
       ├─ Wait 4s → Retry 3
       └─ Eventually ✓ Connected


Network Disconnected During Session
    │
    ├─ Socket.io detects loss
    │
    └─ Auto-reconnect kicks in
       │
       ├─ Wait 1s → Reconnect
       │  ✓ Success → Resume listening
       │
       └─ ✗ Failed → Keep retrying
          │
          └─ When restored → Auto-sync caught-up changes
```

## Performance Considerations

```
Single Broadcast Event
├─ Size: ~0.5-2KB (JSON data)
├─ Network latency: 1-10ms
└─ Propagation to all clients: <50ms

1000 Users connected
├─ Broadcast overhead: ~100KB total
├─ Process time: <100ms
└─ Memory per connection: ~50KB

Optimization strategies:
├─ Debounce rapid changes (300-1000ms)
├─ Batch multiple changes
├─ Filter unnecessary fields
└─ Limit change stream scope
```

## State Management Integration

```
Option 1: React Components
├─ useCollectionSync('products')
└─ Returns: { items, isConnected, isLoading }


Option 2: Redux/Zustand/Pinia (External State)
├─ Create store
├─ Listen to useCollectionSync()
├─ Dispatch actions to update store
└─ Components read from store


Option 3: Local Database (SQLite/IndexedDB for Electron)
├─ Listen to sync events
├─ Save to local DB
├─ Work offline, sync when online
└─ Best for large datasets
```

---

All diagrams show the complete real-time sync architecture for your application stack. Each component works together to provide instant synchronization across all connected apps.
