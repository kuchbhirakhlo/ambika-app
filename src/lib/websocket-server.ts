import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import mongoose from 'mongoose';

const COLLECTIONS = [
  'products',
  'customers',
  'orders',
  'suppliers',
  'inventory',
  'employees',
  'agents',
  'vendors',
  'estimates',
];

interface SyncEvent {
  operationType: 'insert' | 'update' | 'delete';
  collectionName: string;
  documentKey: { _id: string };
  fullDocument?: Record<string, any>;
  updateDescription?: {
    updatedFields: Record<string, any>;
    removedFields: string[];
  };
}

class RealtimeSyncServer {
  private io: SocketIOServer | null = null;
  private changeStreams: Map<string, any> = new Map();

  /**
   * Initialize the Socket.io server
   */
  initializeSocketIO(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ['http://localhost:3000', 'http://localhost:*'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupSocketEvents();
    return this.io;
  }

  /**
   * Setup basic socket event handlers
   */
  private setupSocketEvents() {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Subscribe to specific collections
      socket.on('subscribe', (collectionName: string) => {
        if (COLLECTIONS.includes(collectionName)) {
          socket.join(`collection:${collectionName}`);
          console.log(`[${socket.id}] subscribed to ${collectionName}`);
        }
      });

      // Unsubscribe from collections
      socket.on('unsubscribe', (collectionName: string) => {
        socket.leave(`collection:${collectionName}`);
        console.log(`[${socket.id}] unsubscribed from ${collectionName}`);
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  }

  /**
   * Watch MongoDB collection for changes using Change Streams
   */
  async watchCollection(collectionName: string) {
    if (this.changeStreams.has(collectionName)) {
      console.log(`Already watching ${collectionName}`);
      return;
    }

    try {
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI!);
      }

      const collection = mongoose.connection.collection(collectionName);

      // Create a change stream for the collection
      const changeStream = collection.watch([], {
        fullDocument: 'updateLookup', // Return the full document for updates
        resumeAfter: null,
      });

      this.changeStreams.set(collectionName, changeStream);

      changeStream.on('change', (change: any) => {
        this.broadcastChange(collectionName, change);
      });

      changeStream.on('error', (error) => {
        console.error(`Change stream error for ${collectionName}:`, error);
        this.changeStreams.delete(collectionName);
      });

      console.log(`Watching collection: ${collectionName}`);
    } catch (error) {
      console.error(`Error watching collection ${collectionName}:`, error);
    }
  }

  /**
   * Watch all collections
   */
  async watchAllCollections() {
    for (const collectionName of COLLECTIONS) {
      await this.watchCollection(collectionName);
    }
  }

  /**
   * Broadcast changes to connected clients
   */
  private broadcastChange(collectionName: string, change: SyncEvent) {
    if (!this.io) return;

    const eventData = {
      timestamp: new Date(),
      operationType: change.operationType,
      documentId: change.documentKey._id,
      fullDocument: change.fullDocument,
      updateDescription: change.updateDescription,
    };

    // Broadcast to all clients subscribed to this collection
    this.io.to(`collection:${collectionName}`).emit('data-change', {
      collectionName,
      ...eventData,
    });

    console.log(`[${collectionName}] Broadcasted ${change.operationType}:`, eventData.documentId);
  }

  /**
   * Get Socket.io instance
   */
  getIO(): SocketIOServer | null {
    return this.io;
  }

  /**
   * Close all change streams and disconnect
   */
  async disconnect() {
    for (const [collectionName, changeStream] of this.changeStreams) {
      await changeStream.close();
      console.log(`Closed change stream for ${collectionName}`);
    }
    this.changeStreams.clear();

    if (this.io) {
      this.io.close();
    }
  }
}

// Export singleton instance
export const realtimeSyncServer = new RealtimeSyncServer();