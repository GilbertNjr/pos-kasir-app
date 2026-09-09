import { useEffect, useState } from 'react';

type RealtimeEventHandler = (data: any) => void;
type ConnectionStatusHandler = (isConnected: boolean) => void;

class RealtimeService {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<RealtimeEventHandler>> = new Map();
  private connectionListeners: Set<ConnectionStatusHandler> = new Set();
  private connected: boolean = false;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private isConnecting: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // Reconnect when network comes back online
      window.addEventListener('online', () => {
        console.log('[RealtimeService] Network back online, reconnecting SSE...');
        this.reconnect();
      });

      // Reconnect and trigger refresh when waking up from phone screen sleep or tab focus
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.handleWakeUp();
        }
      });

      window.addEventListener('focus', () => {
        this.handleWakeUp();
      });
    }
  }

  private handleWakeUp() {
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      console.log('[RealtimeService] Device / tab wake up detected, reconnecting...');
      this.reconnect();
    } else {
      // Notify active listeners to verify freshness without full reload
      this.dispatchEvent('SYSTEM_WAKEUP', { timestamp: new Date().toISOString() });
    }
  }

  /**
   * Connect to Server-Sent Events stream (singleton connection).
   */
  public connect(): void {
    if (typeof window === 'undefined') return;
    if (this.eventSource && (this.eventSource.readyState === EventSource.OPEN || this.eventSource.readyState === EventSource.CONNECTING)) {
      return;
    }
    if (this.isConnecting) return;

    this.isConnecting = true;

    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      const sse = new EventSource('/api/events');
      this.eventSource = sse;

      sse.onopen = () => {
        this.isConnecting = false;
        this.connected = true;
        this.reconnectAttempts = 0;
        this.notifyConnectionListeners(true);
      };

      sse.onerror = () => {
        this.isConnecting = false;
        if (this.connected) {
          this.connected = false;
          this.notifyConnectionListeners(false);
        }
        sse.close();
        this.eventSource = null;
        this.scheduleReconnect();
      };

      // Register standard known system events
      const knownEvents = [
        'connected',
        'SHIFT_OPENED',
        'SHIFT_CLOSED',
        'TRANSACTION_CREATED',
        'TRANSACTION_CANCELLED',
        'TRANSACTION_DELETED',
        'TRANSACTION_RESTORED',
        'STOCK_UPDATED',
        'PRODUCT_UPDATED',
        'SETTINGS_UPDATED',
        'USER_UPDATED',
        'BACKUP_CREATED',
        'BACKUP_DELETED',
        'BACKUP_RESTORED',
      ];

      knownEvents.forEach((eventType) => {
        sse.addEventListener(eventType, (e: any) => {
          this.handleIncomingEvent(eventType, e.data);
        });
      });
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempts++;
    // Exponential backoff capped at 10 seconds
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 10000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  public reconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
    this.connect();
    this.dispatchEvent('SYSTEM_WAKEUP', { timestamp: new Date().toISOString() });
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connected = false;
    this.isConnecting = false;
    this.notifyConnectionListeners(false);
  }

  private handleIncomingEvent(eventType: string, rawData: any): void {
    let parsed = rawData;
    if (typeof rawData === 'string') {
      try {
        parsed = JSON.parse(rawData);
      } catch {
        parsed = rawData;
      }
    }
    this.dispatchEvent(eventType, parsed);
  }

  private dispatchEvent(eventType: string, data: any): void {
    const specificListeners = this.listeners.get(eventType);
    if (specificListeners) {
      specificListeners.forEach((handler) => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[RealtimeService] Error executing listener for event '${eventType}':`, err);
        }
      });
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((handler) => {
        try {
          handler({ type: eventType, data });
        } catch (err) {
          console.error(`[RealtimeService] Error executing wildcard listener:`, err);
        }
      });
    }
  }

  /**
   * Subscribe to a specific real-time event. Returns an unsubscribe function.
   */
  public subscribe(eventType: string, handler: RealtimeEventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    // Ensure connection is established
    this.connect();

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Listen to connection status changes.
   */
  public onConnectionChange(handler: ConnectionStatusHandler): () => void {
    this.connectionListeners.add(handler);
    handler(this.connected);
    return () => {
      this.connectionListeners.delete(handler);
    };
  }

  public isConnected(): boolean {
    return this.connected;
  }

  private notifyConnectionListeners(status: boolean): void {
    this.connectionListeners.forEach((cb) => {
      try {
        cb(status);
      } catch {}
    });
  }
}

export const realtimeService = new RealtimeService();

/**
 * React hook to subscribe to a realtime event with automatic cleanup on unmount.
 */
export function useRealtimeSubscription(eventType: string, handler: RealtimeEventHandler, deps: any[] = []) {
  useEffect(() => {
    const unsubscribe = realtimeService.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, ...deps]);
}

/**
 * React hook to observe realtime connection status.
 */
export function useRealtimeStatus(): boolean {
  const [status, setStatus] = useState<boolean>(realtimeService.isConnected());

  useEffect(() => {
    const unsubscribe = realtimeService.onConnectionChange((connected) => {
      setStatus(connected);
    });
    return unsubscribe;
  }, []);

  return status;
}
