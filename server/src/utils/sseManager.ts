import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Start 20-second keep-alive heartbeat ping to prevent proxies/mobile carrier NAT timeouts.
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      if (this.clients.size === 0) {
        this.stopHeartbeat();
        return;
      }
      this.clients.forEach((client) => {
        try {
          client.res.write(': ping\n\n');
        } catch {
          this.removeClient(client.id);
        }
      });
    }, 20000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Register a new client for Server-Sent Events.
   */
  public addClient(id: string, res: Response, userId?: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    // Send initial ping connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    this.clients.set(id, { id, res, userId });
    this.startHeartbeat();

    res.on('close', () => {
      this.removeClient(id);
    });
  }

  /**
   * Remove client on disconnect.
   */
  public removeClient(id: string): void {
    if (this.clients.has(id)) {
      this.clients.delete(id);
    }
    if (this.clients.size === 0) {
      this.stopHeartbeat();
    }
  }

  /**
   * Broadcast event signal to all connected clients (or filter by specific role/user).
   */
  public broadcast(eventType: string, data: any): void {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => {
      try {
        client.res.write(payload);
      } catch (err) {
        this.removeClient(client.id);
      }
    });
  }

  /**
   * Get active connected client count.
   */
  public getClientCount(): number {
    return this.clients.size;
  }
}

export const sseManager = new SSEManager();
