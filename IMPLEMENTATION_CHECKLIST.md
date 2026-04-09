# ✅ Implementation Checklist

Track your progress implementing real-time MongoDB sync for your web and Electron apps.

---

## 🚀 Phase 0: Setup & Start (Complete - ✅ Already Done)

- [x] Install dependencies (socket.io, express, cors, ts-node)
- [x] Create WebSocket server (src/lib/websocket-server.ts)
- [x] Create custom server (server.ts)
- [x] Create broadcast utility (src/lib/broadcast-sync.ts)
- [x] Create React hooks (src/hooks/useRealtimeSync.ts)
- [x] Create Electron service (src/lib/realtime-sync-service.ts)
- [x] Create comprehensive documentation
- [x] Update package.json scripts

**Status:** ✅ **COMPLETE**

---

## 📖 Phase 1: Learn & Understand

**Time:** ~30 minutes

- [ ] Read [GETTING_STARTED.md](./GETTING_STARTED.md)
- [ ] Skim [ARCHITECTURE.md](./ARCHITECTURE.md) for system overview
- [ ] Review [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) cheat sheet
- [ ] Check [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) to understand file layout

**When complete:** You understand what's been implemented and how it works

---

## 🚀 Phase 2: Start Development Server

**Time:** ~5 minutes

**Prerequisites:** Complete Phase 1

**Steps:**

1. [ ] Open terminal in `/Users/aviralshukla/Documents/ambika-app`
2. [ ] Run command:
   ```bash
   npm run dev:sync
   ```
3. [ ] Server should start with messages:
   - `> Ready on http://localhost:3000`
   - `> Real-time sync server running with Socket.io`
4. [ ] Open browser: [http://localhost:3000](http://localhost:3000)
5. [ ] Open DevTools Console (F12)
6. [ ] Should see message:
   - `Connected to real-time sync server`

**Status Check:** 
- [ ] Server is running
- [ ] Browser loads page
- [ ] Console shows connection message

**When complete:** Server is running and ready for sync events

---

## 📡 Phase 3: Update API Routes (CRITICAL)

**Time:** ~45 minutes  
**Prerequisites:** Phase 2 (server running)

This is **REQUIRED** for sync to work! Without this, products won't sync.

### Priority 1 - START HERE (10 minutes)

**File:** `src/app/api/products/route.ts`

**Steps:**
1. [ ] Open file
2. [ ] Add import at top:
   ```typescript
   import { broadcastChange } from '@/lib/broadcast-sync';
   ```
3. [ ] In POST handler (after `await Product.create(data)`):
   ```typescript
   broadcastChange('products', 'insert', newProduct._id.toString(), JSON.parse(JSON.stringify(newProduct)));
   ```
4. [ ] In PUT handler (after update):
   ```typescript
   broadcastChange('products', 'update', id, JSON.parse(JSON.stringify(updatedProduct)), { updatedFields: data });
   ```
5. [ ] In DELETE handler (after delete):
   ```typescript
   broadcastChange('products', 'delete', id);
   ```
6. [ ] Save file
7. [ ] Test with curl (from [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#-debug))

**Status:** [ ] Products sync enabled

---

### Priority 1 (continued)

**File:** `src/app/api/orders/route.ts`

- [ ] Repeat same 5 steps for orders route
- [ ] Test with curl

**Status:** [ ] Orders sync enabled

---

### Priority 2 (15 minutes)

Update these files with same pattern:
- [ ] `src/app/api/customers/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/suppliers/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/inventory/route.ts` - Add broadcast to POST/PUT/DELETE

**For each file:**
1. Add import: `import { broadcastChange } from '@/lib/broadcast-sync';`
2. After create: `broadcastChange('collectionName', 'insert', newItem._id.toString(), JSON.parse(JSON.stringify(newItem)));`
3. After update: `broadcastChange('collectionName', 'update', id, JSON.parse(JSON.stringify(updated)), { updatedFields: data });`
4. After delete: `broadcastChange('collectionName', 'delete', id);`

**Test:** Open API in browser / use curl to create items

**Status:** [ ] Customers sync, [ ] Suppliers sync, [ ] Inventory sync

---

### Priority 3 (20 minutes)

Update these files with same pattern:
- [ ] `src/app/api/employees/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/agents/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/vendors/route.ts` - Add broadcast to POST/PUT/DELETE
- [ ] `src/app/api/estimates/route.ts` - Add broadcast to POST/PUT/DELETE

**For each file:** Use same pattern as Priority 2

**Status:** [ ] Employees sync, [ ] Agents sync, [ ] Vendors sync, [ ] Estimates sync

---

### Verification

After updating all routes:
- [ ] Check server console for messages like: `[products] Broadcasted insert: <id>`
- [ ] Make a POST request to create an item
- [ ] Server should log the broadcast
- [ ] If using React component with hook, item should appear instantly

**When complete:** All API routes broadcast changes in real-time

---

## 💻 Phase 4: Update React Components (Optional)

**Time:** ~30 minutes  
**Prerequisites:** Phase 3 (API routes updated)

This is optional but recommended - gives you auto-syncing UI.

### Step 1: Understand the Hook

- [ ] Read [COMPONENT_EXAMPLE.tsx](./COMPONENT_EXAMPLE.tsx)
- [ ] Review [REALTIME_SYNC_SETUP.md#use-in-react-components](./REALTIME_SYNC_SETUP.md#use-in-react-components)

### Step 2: Update Product Page

**File:** `src/dashboard/products/page.tsx`

```typescript
// Add import
import { useCollectionSync } from '@/hooks/useRealtimeSync';

// In component, replace your fetch logic with:
const { items: products, isConnected, isLoading } = useCollectionSync('products');

// That's it! items will auto-update when changes happen.
```

- [ ] Updated products page
- [ ] Tested: Create product via API, see it appear instantly

### Step 3: Update Other Dashboard Pages (Optional)

For each file, add the hook:
- [ ] `src/dashboard/orders/page.tsx`
- [ ] `src/dashboard/customers/page.tsx`
- [ ] `src/dashboard/suppliers/page.tsx`
- [ ] `src/dashboard/inventory/page.tsx`
- [ ] `src/dashboard/employees/page.tsx`

## 🖥️ Phase 5: Connect Electron App

**Time:** ~20 minutes  
**Prerequisites:** Phase 3 (API routes) working

### Step 1: Prepare Electron Project

- [ ] Locate your Electron project folder
- [ ] Create directory: `src/services/`

### Step 2: Copy Sync Service

- [ ] Copy file: `ambika-app/src/lib/realtime-sync-service.ts`
- [ ] Paste to: `electron-app/src/services/realtime-sync-service.ts`

### Step 3: Update Main Process

In your Electron main.ts:

```typescript
import { RealtimeSyncService } from './services/realtime-sync-service';

const syncService = new RealtimeSyncService();

app.on('ready', async () => {
  try {
    await syncService.connect('http://localhost:3000');
    console.log('✓ Connected to sync server');
  } catch (error) {
    console.error('✗ Failed to connect:', error);
  }
  createWindow();
});

app.on('will-quit', async () => {
  await syncService.disconnect();
});
```

- [ ] Added sync service import
- [ ] Added connection in app.ready
- [ ] Added disconnect in app.will-quit

### Step 4: Subscribe in Renderer

In your Electron renderer/component:

```typescript
import { RealtimeSyncService } from '../services/realtime-sync-service';

const syncService = new RealtimeSyncService();

// Subscribe when component mounts
syncService.subscribe('products', (change) => {
  console.log('Product changed:', change);
  // Update your UI based on change
});
```

- [ ] Added subscriptions to collections you need
- [ ] Update UI when changes received

### Step 5: Test Connection

- [ ] Start web app: `npm run dev:sync`
- [ ] Start Electron app
- [ ] Check console: should see "Connected to sync server"
- [ ] Create/update/delete in web app
- [ ] Verify changes appear in Electron

**When complete:** Electron app receives real-time updates

---

## 🧪 Phase 6: End-to-End Testing

**Time:** ~10 minutes  
**Prerequisites:** All previous phases

### Test 1: Web App → Web App
- [ ] Open web app in 2 browser windows
- [ ] Create item in first window
- [ ] Second window sees it instantly

### Test 2: Web App → Electron
- [ ] Web app running
- [ ] Electron app running
- [ ] Create/edit/delete in web app
- [ ] Changes appear instantly in Electron

### Test 3: Electron → Web App
- [ ] Create/edit/delete in Electron (if you added mutation logic)
- [ ] Changes appear instantly in web app

### Test 4: Multiple Operations
- [ ] Create 5 items quickly
- [ ] All appear instantly in all apps
- [ ] Update one item
- [ ] Delete one item
- [ ] All apps stay in sync

### Test 5: Offline Scenario
- [ ] Close web server (Ctrl+C)
- [ ] Verify apps try to reconnect
- [ ] Restart web server
- [ ] Apps reconnect automatically

**When complete:** Everything syncs in real-time! 🎉

---

## 📋 Summary Checklist

```
Phase 0: Setup & Start                          ✅ DONE
Phase 1: Learn & Understand                     [ ] TO DO
Phase 2: Start Development Server               [ ] TO DO
Phase 3: Update API Routes                      [ ] TO DO
  - Priority 1 (products, orders)               [ ] TO DO
  - Priority 2 (customers, suppliers, inv)      [ ] TO DO
  - Priority 3 (employees, agents, etc)         [ ] TO DO
Phase 4: Update React Components (Optional)     [ ] TO DO
Phase 5: Connect Electron App                   [ ] TO DO
Phase 6: End-to-End Testing                     [ ] TO DO
```

---

## 🎯 Success Indicators

You'll know it's working when:

- [ ] Server runs without errors
- [ ] Browser shows "Connected to real-time sync server"
- [ ] Creating item via API broadcasts to browser instantly
- [ ] Multiple browser windows stay perfectly in sync
- [ ] Electron app receives and displays changes instantly
- [ ] Can create/update/delete and see sync happen <100ms

---

## 🆘 If Something Stops Working

1. [ ] Check server is running: `npm run dev:sync`
2. [ ] Check no errors in terminal
3. [ ] Check browser console (F12) for messages
4. [ ] Check browser shows "Connected to real-time sync server"
5. [ ] Verify API route has `broadcastChange()` call
6. [ ] Test with curl: see [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
7. [ ] See [SYNC_CONFIGURATION.md#troubleshooting-guide](./SYNC_CONFIGURATION.md#troubleshooting-guide)

---

## 📚 Quick Reference

| Need | See |
|------|-----|
| Copy-paste code | [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) |
| API route help | [UPDATE_API_ROUTES.md](./UPDATE_API_ROUTES.md) |
| Electron setup | [REALTIME_SYNC_SETUP.md](./REALTIME_SYNC_SETUP.md#electron-desktop-app-setup) |
| Troubleshooting | [SYNC_CONFIGURATION.md](./SYNC_CONFIGURATION.md#troubleshooting-guide) |
| React component | [COMPONENT_EXAMPLE.tsx](./COMPONENT_EXAMPLE.tsx) |
| Understand system | [ARCHITECTURE.md](./ARCHITECTURE.md) |

---

## ⏱️ Time Tracking

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|--------|
| 0: Setup | (Done) | ✅ | ✅ |
| 1: Learn | 30 min | ___ | [ ] |
| 2: Server | 5 min | ___ | [ ] |
| 3: API Routes | 45 min | ___ | [ ] |
| 4: React | 30 min | ___ | [ ] |
| 5: Electron | 20 min | ___ | [ ] |
| 6: Testing | 10 min | ___ | [ ] |
| **Total** | **~2 hours** | *_____* | |

---

## 🎉 When Complete

Congratulations! You now have:
- ✅ Real-time MongoDB sync between web and desktop
- ✅ Instant data propagation to all clients
- ✅ Production-ready architecture
- ✅ Scalable for multiple users

**Next Steps:**
1. Deploy to production
2. Connect multiple users
3. Monitor performance
4. Add authentication if needed
5. Celebrate! 🚀

---

**Start with Phase 1:** [GETTING_STARTED.md](./GETTING_STARTED.md)

Good luck! 💪
