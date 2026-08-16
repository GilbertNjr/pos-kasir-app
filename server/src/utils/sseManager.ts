import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();

  /**
   * Register a new client for Server-Sent Events.
   */
  public addClient(id: string, res: Response, userId?: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    // Send initial ping connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientId: id, timestamp: new Date().toISOString() })}\n\n`);

    this.clients.set(id, { id, res, userId });

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
