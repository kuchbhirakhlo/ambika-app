import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { realtimeSyncServer } from './src/lib/websocket-server.js';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  });

  // Initialize Socket.io with HTTP server
  const io = realtimeSyncServer.initializeSocketIO(httpServer);

  // Start watching MongoDB collections
  realtimeSyncServer.watchAllCollections();

  const PORT = process.env.PORT || 3000;

  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log('> Real-time sync server running with Socket.io');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await realtimeSyncServer.disconnect();
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
});
