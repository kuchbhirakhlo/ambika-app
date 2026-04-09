import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

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

export interface UseRealtimeSyncOptions {
  collections?: string[];
  onDataChange?: (change: DataChange) => void;
  autoConnect?: boolean;
}

/**
 * Hook for real-time MongoDB sync via WebSocket
 */
export function useRealtimeSync(options: UseRealtimeSyncOptions = {}) {
  const {
    collections = [],
    onDataChange,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to WebSocket server
  useEffect(() => {
    if (!autoConnect) return;

    try {
      const socket = io(window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socket.on('connect', () => {
        console.log('Connected to real-time sync server');
        setIsConnected(true);
        setError(null);

        // Subscribe to collections
        collections.forEach((collection) => {
          socket.emit('subscribe', collection);
        });
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from real-time sync server');
        setIsConnected(false);
      });

      socket.on('data-change', (change: DataChange) => {
        console.log('Data change received:', change);
        onDataChange?.(change);
      });

      socket.on('error', (err) => {
        console.error('WebSocket error:', err);
        setError(err.message || 'WebSocket error');
      });

      socketRef.current = socket;

      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to sync server';
      console.error('Connection error:', message);
      setError(message);
    }
  }, [autoConnect, collections, onDataChange]);

  // Subscribe to additional collections
  const subscribe = useCallback((collectionName: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('subscribe', collectionName);
    }
  }, [isConnected]);

  // Unsubscribe from collections
  const unsubscribe = useCallback((collectionName: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('unsubscribe', collectionName);
    }
  }, [isConnected]);

  return {
    isConnected,
    error,
    socket: socketRef.current,
    subscribe,
    unsubscribe,
  };
}

/**
 * Hook for listening to specific collection changes
 */
export function useCollectionSync<T extends Record<string, any>>(
  collectionName: string,
  onUpdate?: (items: T[]) => void
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle data changes from real-time sync
  const handleDataChange = useCallback((change: DataChange) => {
    if (change.collectionName !== collectionName) return;

    setItems((prevItems) => {
      let updatedItems = [...prevItems];

      switch (change.operationType) {
        case 'insert':
          if (change.fullDocument) {
            updatedItems.unshift({
              ...change.fullDocument,
              _id: change.documentId,
            } as unknown as T);
          }
          break;

        case 'update':
          updatedItems = updatedItems.map((item) =>
            (item._id || item.id) === change.documentId
              ? ({
                  ...item,
                  ...change.updateDescription?.updatedFields,
                  updatedAt: new Date(),
                } as unknown as T)
              : item
          );
          break;

        case 'delete':
          updatedItems = updatedItems.filter(
            (item) => (item._id || item.id) !== change.documentId
          );
          break;
      }

      onUpdate?.(updatedItems);
      return updatedItems;
    });
  }, [collectionName, onUpdate]);

  // Initialize real-time sync
  const { isConnected } = useRealtimeSync({
    collections: [collectionName],
    onDataChange: handleDataChange,
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/${collectionName}`);
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        setItems(data[collectionName] || data.items || []);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch data';
        console.error(`Error fetching ${collectionName}:`, message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [collectionName]);

  return {
    items,
    isLoading,
    error,
    isConnected,
    refetch: async () => {
      const response = await fetch(`/api/${collectionName}`);
      const data = await response.json();
      const fetchedItems = data[collectionName] || data.items || [];
      setItems(fetchedItems);
      return fetchedItems;
    },
  };
}
