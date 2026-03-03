import { Router, Request, Response } from "express";
import { requireAuth } from "./auth";
import { db } from "./db";
import { devicePushTokens, restaurants } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

interface PushAuthRequest extends Request {
  ownerId?: number;
}

router.post("/push/register", requireAuth, async (req: PushAuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body;

    if (!token || !platform) {
      return res.status(400).json({ message: "Token and platform are required" });
    }

    if (!["android", "ios", "web"].includes(platform)) {
      return res.status(400).json({ message: "Invalid platform. Must be android, ios, or web" });
    }

    if (!req.ownerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const existing = await db
      .select()
      .from(devicePushTokens)
      .where(and(eq(devicePushTokens.ownerId, req.ownerId), eq(devicePushTokens.token, token)));

    if (existing.length > 0) {
      return res.json({ message: "Token already registered" });
    }

    await db.insert(devicePushTokens).values({
      ownerId: req.ownerId,
      token,
      platform,
    });

    res.json({ message: "Push token registered successfully" });
  } catch (error: any) {
    console.error("Error registering push token:", error);
    res.status(500).json({ message: "Failed to register push token" });
  }
});

router.delete("/push/unregister", requireAuth, async (req: PushAuthRequest, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    if (!req.ownerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    await db
      .delete(devicePushTokens)
      .where(and(eq(devicePushTokens.ownerId, req.ownerId), eq(devicePushTokens.token, token)));

    res.json({ message: "Push token unregistered successfully" });
  } catch (error: any) {
    console.error("Error unregistering push token:", error);
    res.status(500).json({ message: "Failed to unregister push token" });
  }
});

export async function sendPushNotification(ownerId: number, title: string, body: string, data?: Record<string, string>) {
  try {
    const tokens = await db
      .select()
      .from(devicePushTokens)
      .where(eq(devicePushTokens.ownerId, ownerId));

    if (tokens.length === 0) {
      return;
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log(`[Push] Firebase not configured. Would send to ${tokens.length} device(s) for owner ${ownerId}: "${title}" - "${body}"`);
      return;
    }

    try {
      const admin = await import("firebase-admin");

      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      const messaging = admin.messaging();

      const results = await Promise.allSettled(
        tokens.map((t) =>
          messaging.send({
            token: t.token,
            notification: { title, body },
            data: data || {},
            android: { priority: "high" },
            apns: { payload: { aps: { sound: "default", badge: 1 } } },
          })
        )
      );

      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        console.log(`[Push] ${failed.length}/${tokens.length} push(es) failed for owner ${ownerId}`);
        for (const f of failed) {
          if (f.status === "rejected" && (f.reason?.code === "messaging/invalid-registration-token" || f.reason?.code === "messaging/registration-token-not-registered")) {
            const idx = results.indexOf(f);
            if (idx >= 0) {
              await db.delete(devicePushTokens).where(eq(devicePushTokens.id, tokens[idx].id));
            }
          }
        }
      }

      console.log(`[Push] Sent ${results.length - failed.length}/${tokens.length} push(es) for owner ${ownerId}`);
    } catch (firebaseError) {
      console.error("[Push] Firebase send error:", firebaseError);
    }
  } catch (error) {
    console.error("[Push] Error in sendPushNotification:", error);
  }
}

export async function sendPushToRestaurantOwner(restaurantId: number, title: string, body: string, data?: Record<string, string>) {
  try {
    const restaurant = await db
      .select({ ownerId: restaurants.ownerId })
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (restaurant.length === 0 || !restaurant[0].ownerId) return;

    await sendPushNotification(restaurant[0].ownerId, title, body, data);
  } catch (error) {
    console.error("[Push] Error finding restaurant owner:", error);
  }
}

export { router as pushRouter };
