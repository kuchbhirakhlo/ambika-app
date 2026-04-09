/**
 * Electron Desktop App - Real-time MongoDB Sync Service
 * 
 * Usage in your Electron app:
 * 
 * import { RealtimeSyncService } from './realtime-sync-service';
 * 
 * const syncService = new RealtimeSyncService();
 * 
 * // Connect and subscribe to collections
 * await syncService.connect('http://localhost:3000');
 * syncService.subscribe('products', (change) => {
 *   console.log('Product changed:', change);
 *   // Update your UI or local state
 * });
 * 
 * // Handle disconnection
 * await syncService.disconnect();
 */

import { io, Socket } from 'socket.io-client';

export interface DataChange {
  collectionName: string;
  timestamp: Date;
  operationType: 'insert' | 'update' | 'delete';
  documentId: string;
  fullDocument?: Record<string, any>;
  updateDescription?: {
    updatedFields: Record<string, any>;
    removedFields: string[];
  };
}

export type ChangeCallback = (change: DataChange) => void;

export class RealtimeSyncService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<ChangeCallback>> = new Map();
  private globalListeners: Set<ChangeCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  /**
   * Connect to the WebSocket server
   */
  async connect(serverUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: this.maxReconnectAttempts,
        });

        this.socket.on('connect', () => {
          console.log('[Sync] Connected to server');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('data-change', (change: DataChange) => {
          this.handleDataChange(change);
        });

        this.socket.on('error', (error) => {
          console.error('[Sync] Connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('[Sync] Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
          this.reconnectAttempts++;
          console.error('[Sync] Connection error:', error, `Attempt ${this.reconnectAttempts}`);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Subscribe to changes for a specific collection
   */
  subscribe(
    collectionName: string,
    callback: ChangeCallback
  ): void {
    if (!this.socket?.connected) {
      console.warn('[Sync] Not connected. Please call connect() first.');
      return;
    }

    // Add callback to listeners
    if (!this.listeners.has(collectionName)) {
      this.listeners.set(collectionName, new Set());
    }
    this.listeners.get(collectionName)?.add(callback);

    // Subscribe via socket
    this.socket.emit('subscribe', collectionName);
    console.log(`[Sync] Subscribed to ${collectionName}`);
  }

  /**
   * Unsubscribe from a collection
   */
  unsubscribe(
    collectionName: string,
    callback?: ChangeCallback
  ): void {
    if (!this.socket?.connected) return;

    if (callback) {
      this.listeners.get(collectionName)?.delete(callback);
    } else {
      this.listeners.delete(collectionName);
    }

    // If no more listeners, unsubscribe via socket
    if (!this.listeners.has(collectionName) || this.listeners.get(collectionName)?.size === 0) {
      this.socket.emit('unsubscribe', collectionName);
      console.log(`[Sync] Unsubscribed from ${collectionName}`);
    }
  }

  /**
   * Listen to ALL changes from any collection
   */
  onAnyChange(callback: ChangeCallback): void {
    this.globalListeners.add(callback);
  }

  /**
   * Stop listening to all changes
   */
  offAnyChange(callback: ChangeCallback): void {
    this.globalListeners.delete(callback);
  }

  /**
   * Handle incoming data changes
   */
  private handleDataChange(change: DataChange): void {
    // Call collection-specific listeners
    const collectionListeners = this.listeners.get(change.collectionName);
    if (collectionListeners) {
      collectionListeners.forEach((callback) => {
        try {
          callback(change);
        } catch (error) {
          console.error('[Sync] Error in callback:', error);
        }
      });
    }

    // Call global listeners
    this.globalListeners.forEach((callback) => {
      try {
        callback(change);
      } catch (error) {
        console.error('[Sync] Error in global callback:', error);
      }
    });
  }

  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.disconnect();
        this.listeners.clear();
        this.globalListeners.clear();
        console.log('[Sync] Disconnected');
      }
      resolve();
    });
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance for easy use
export const syncService = new RealtimeSyncService();
