# Real-Time Sync Diagnostic Checklist for Suppliers

## ⚠️ CRITICAL ISSUES FOUND

### Issue 1: Server Not Running with Sync Enabled
**Status**: ❌ LIKELY PROBLEM
- **What to check**: Are you running `npm run dev:sync` or `npm run dev`?
- **Impact**: If running `npm run dev`, the sync server won't start and MongoDB changes won't be broadcast
- **Solution**: 
  ```bash
  npm run dev:sync
  ```
  This starts the custom server with Express + Socket.io instead of Next.js dev server

---

### Issue 2: React Components Not Using Real-Time Sync Hook
**Status**: ❌ CONFIRMED ISSUE
- **Location**: [src/app/dashboard/suppliers/page.tsx](src/app/dashboard/suppliers/page.tsx)
- **Problem**: The suppliers page is NOT using `useRealtimeSync` hook
- **Current Behavior**: Fetches suppliers once on load, manual refresh on modals only
- **Expected Behavior**: Should auto-update when any client adds/updates/deletes suppliers
- **Fix Required**: Add the hook to the page

---

### Issue 3: Electron App Connection Configuration
**Status**: ⚠️ NEEDS VERIFICATION
- Check if Electron app is:
  1. Connecting to correct server URL: `http://localhost:3000`
  2. Subscribing to collection: `suppliers` (case-sensitive)
  3. Handling the `data-change` events properly

---

## ✅ What IS Working

✓ Supplier API routes (POST/PUT/DELETE) have `broadcastChange()` calls  
✓ MongoDB Change Streams configured for 'suppliers' collection  
✓ Socket.io server listening on port 3000  
✓ WebSocket transport with fallback to polling  
✓ `broadcast-sync.ts` correctly sends events to Socket.io  
✓ Electron `RealtimeSyncService` properly configured  

---

## How to Fix Real-Time Sync for Suppliers

### Step 1: Update Suppliers Page Component
Add `useRealtimeSync` hook to auto-update supplier list:

```typescript
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Add real-time sync hook
  useRealtimeSync({
    collections: ['suppliers'],
    onDataChange: (change) => {
      if (change.collectionName === 'suppliers') {
        // Refresh suppliers when changes occur
        fetchSuppliers();
      }
    },
  });
  
  // ... rest of component
}
```

### Step 2: Ensure Server is Running Correctly
```bash
# Kill any existing processes
pkill -f "server.ts"

# Start with sync enabled
npm run dev:sync
```

You should see:
```
> Ready on http://localhost:3000
> Real-time sync server running with Socket.io
Watching collection: suppliers
```

### Step 3: Verify Electron App Connection
In your Electron app's sync code:

```typescript
const syncService = new RealtimeSyncService();
await syncService.connect('http://localhost:3000');
syncService.subscribe('suppliers', (change) => {
  console.log('Supplier updated:', change);
  // Update your Electron app UI here
});
```

---

## Testing Real-Time Sync

### Test 1: Check Server Console
When you perform an action (add/edit/delete supplier):
```
[suppliers] Broadcasted insert: 507f1f77bcf86cd799439011
[suppliers] Broadcasted update: 507f1f77bcf86cd799439012
[suppliers] Broadcasted delete: 507f1f77bcf86cd799439013
```

### Test 2: Check Browser Console
Open DevTools → Console:
```
Connected to real-time sync server
Data change received: {collectionName: 'suppliers', operationType: 'insert', ...}
```

### Test 3: Check Electron App Logs
Should show:
```
[Sync] Connected to server
Supplier updated: {operationType: 'insert', documentId: '...'}
```

---

## MongoDB Configuration Check

Verify in `.env`:
```
MONGODB_URI=mongodb+srv://avisr00:***@cluster0.hlywxqi.mongodb.net/...
```

✓ Using MongoDB Atlas (supports Change Streams)
✓ Connection string valid

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Sync events not received | `npm run dev` instead of `npm run dev:sync` | Run `npm run dev:sync` |
| No console logs for changes | Server not watching collection | Check if 'suppliers' collection name is exact match |
| Electron app can't connect | Wrong server URL | Use `http://localhost:3000` |
| Changes broadcast but not received | component not subscribed | Call `socket.emit('subscribe', 'suppliers')` |

---

## Verification Checklist

- [ ] Running `npm run dev:sync` (not `npm run dev`)
- [ ] Server console shows "Watching collection: suppliers"
- [ ] Browser DevTools shows WebSocket connection (green indicator)
- [ ] Suppliers page component uses `useRealtimeSync` hook
- [ ] Adding/updating supplier in one browser tab updates other tabs instantly
- [ ] Electron app connects to `http://localhost:3000`
- [ ] Electron app subscribes to `suppliers` collection
- [ ] Electron app receives `data-change` events

---

## Quick Debug Command

Check if server is syncing:
```bash
# In server terminal, create a test supplier via API
curl -X POST http://localhost:3000/api/suppliers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Supplier",
    "email": "test@test.com",
    "phone": "555-1234",
    "contact": "John",
    "category": "Electronics"
  }'
```

**Expected Result**: You should see broadcast message in server console
