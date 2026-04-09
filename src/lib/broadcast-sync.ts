import { realtimeSyncServer } from './websocket-server';

/**
 * Broadcast a data change event to all connected clients
 * Use this in your API routes to immediately notify clients of changes
 */
export function broadcastChange(
  collectionName: string,
  operationType: 'insert' | 'update' | 'delete',
  documentId: string,
  fullDocument?: Record<string, any>,
  updateDescription?: {
    updatedFields: Record<string, any>;
    removedFields: string[];
  }
) {
  const io = realtimeSyncServer.getIO();
  if (!io) {
    console.warn('Socket.io server not initialized');
    return;
  }

  const eventData = {
    timestamp: new Date(),
    operationType,
    documentId,
    fullDocument,
    updateDescription,
  };

  // Broadcast to all clients subscribed to this collection
  io.to(`collection:${collectionName}`).emit('data-change', {
    collectionName,
    ...eventData,
  });

  console.log(`[${collectionName}] Broadcasted ${operationType}:`, documentId);
}
