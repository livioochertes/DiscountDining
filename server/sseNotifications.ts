import { Router, Request, Response } from "express";
import { requireAuth } from "./auth";
import { storage } from "./storage";

interface SSEClient {
  res: Response;
  restaurantId: number;
}

const clients: Map<number, Set<SSEClient>> = new Map();

export function notifyRestaurant(restaurantId: number, event: { type: string; data: any }) {
  const restaurantClients = clients.get(restaurantId);
  if (!restaurantClients || restaurantClients.size === 0) return;

  const message = `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;

  const deadClients: SSEClient[] = [];
  restaurantClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch (e) {
      deadClients.push(client);
    }
  });

  deadClients.forEach((client) => {
    restaurantClients.delete(client);
  });

  if (restaurantClients.size === 0) {
    clients.delete(restaurantId);
  }
}

const router = Router();

router.get("/restaurant/:id/notifications/stream", requireAuth, async (req: any, res: Response) => {
  const restaurantId = parseInt(req.params.id);
  if (isNaN(restaurantId)) {
    return res.status(400).json({ message: "Invalid restaurant ID" });
  }

  if (!req.ownerId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
  const ownsRestaurant = restaurants.some(r => r.id === restaurantId);
  if (!ownsRestaurant) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  const allRestaurantIds = restaurants.map(r => r.id);
  res.write(`event: connected\ndata: ${JSON.stringify({ restaurantIds: allRestaurantIds })}\n\n`);

  const sseClients: SSEClient[] = [];
  for (const rId of allRestaurantIds) {
    const client: SSEClient = { res, restaurantId: rId };
    if (!clients.has(rId)) {
      clients.set(rId, new Set());
    }
    clients.get(rId)!.add(client);
    sseClients.push(client);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat\n\n`);
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    for (const client of sseClients) {
      const set = clients.get(client.restaurantId);
      if (set) {
        set.delete(client);
        if (set.size === 0) clients.delete(client.restaurantId);
      }
    }
  });
});

export { router as sseRouter };
