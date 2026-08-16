import { Router, Request, Response } from 'express';
import { sseManager } from '../utils/sseManager';

const router = Router();

/**
 * GET /api/events
 * Realtime SSE Stream Endpoint for Dashboard & Notifications.
 */
router.get('/events', (req: Request, res: Response) => {
  const clientId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
  sseManager.addClient(clientId, res);
});

export default router;
