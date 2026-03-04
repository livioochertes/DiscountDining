import { Router, Request, Response } from "express";
import { requireAuth } from "./auth";
import { db } from "./db";
import { devicePushTokens, customerPushTokens, restaurants } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const router = Router();

interface PushAuthRequest extends Request {
  ownerId?: number;
}

router.post("/push/register", requireAuth, async (req: PushAuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body;
    console.log(`[Push] Register request from owner ${req.ownerId}, platform: ${platform}`);

    if (!token || !platform) {
      return res.status(400).json({ message: "Token and platform are required" });
    }

    if (!["android", "ios", "web"].includes(platform)) {
      return res.status(400).json({ message: "Invalid platform. Must be android, ios, or web" });
    }

    if (!req.ownerId) {
      console.log('[Push] Register failed: no ownerId after requireAuth');
      return res.status(401).json({ message: "Authentication required" });
    }

    const existing = await db
      .select()
      .from(devicePushTokens)
      .where(and(eq(devicePushTokens.ownerId, req.ownerId), eq(devicePushTokens.token, token)));

    if (existing.length > 0) {
      console.log(`[Push] Token already registered for owner ${req.ownerId}`);
      return res.json({ message: "Token already registered" });
    }

    await db.insert(devicePushTokens).values({
      ownerId: req.ownerId,
      token,
      platform,
    });

    console.log(`[Push] Token registered successfully for owner ${req.ownerId}, platform: ${platform}`);
    res.json({ message: "Push token registered successfully" });
  } catch (error: any) {
    console.error("[Push] Error registering push token:", error);
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

export async function sendPushToCustomer(customerId: number, title: string, body: string, data?: Record<string, string>) {
  try {
    const tokens = await db
      .select()
      .from(customerPushTokens)
      .where(eq(customerPushTokens.customerId, customerId));

    if (tokens.length === 0) {
      console.log(`[Push] No push tokens for customer ${customerId}`);
      return;
    }

    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log(`[Push] Firebase not configured. Would send to ${tokens.length} device(s) for customer ${customerId}: "${title}" - "${body}"`);
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
        for (const f of failed) {
          if (f.status === "rejected" && (f.reason?.code === "messaging/invalid-registration-token" || f.reason?.code === "messaging/registration-token-not-registered")) {
            const idx = results.indexOf(f);
            if (idx >= 0) {
              await db.delete(customerPushTokens).where(eq(customerPushTokens.id, tokens[idx].id));
            }
          }
        }
      }

      console.log(`[Push] Sent ${results.length - failed.length}/${tokens.length} push(es) for customer ${customerId}`);
    } catch (firebaseError) {
      console.error("[Push] Firebase send error for customer:", firebaseError);
    }
  } catch (error) {
    console.error("[Push] Error in sendPushToCustomer:", error);
  }
}

router.post("/customer/push/register", async (req: any, res: Response) => {
  try {
    const { token, platform } = req.body;
    const mobileUser = req.mobileUser;

    if (!mobileUser) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!token || !platform) {
      return res.status(400).json({ message: "Token and platform are required" });
    }

    if (!["android", "ios", "web"].includes(platform)) {
      return res.status(400).json({ message: "Invalid platform" });
    }

    const customerId = mobileUser.customerId || mobileUser.id;
    if (!customerId) {
      return res.status(401).json({ message: "Customer not found" });
    }

    const existing = await db
      .select()
      .from(customerPushTokens)
      .where(and(eq(customerPushTokens.customerId, customerId), eq(customerPushTokens.token, token)));

    if (existing.length > 0) {
      return res.json({ message: "Token already registered" });
    }

    await db.insert(customerPushTokens).values({ customerId, token, platform });
    console.log(`[Push] Customer ${customerId} registered push token, platform: ${platform}`);
    res.json({ message: "Push token registered successfully" });
  } catch (error: any) {
    console.error("[Push] Error registering customer push token:", error);
    res.status(500).json({ message: "Failed to register push token" });
  }
});

router.delete("/customer/push/unregister", async (req: any, res: Response) => {
  try {
    const { token } = req.body;
    const mobileUser = req.mobileUser;

    if (!mobileUser) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const customerId = mobileUser.customerId || mobileUser.id;
    await db.delete(customerPushTokens)
      .where(and(eq(customerPushTokens.customerId, customerId), eq(customerPushTokens.token, token)));

    res.json({ message: "Push token unregistered" });
  } catch (error: any) {
    console.error("[Push] Error unregistering customer push token:", error);
    res.status(500).json({ message: "Failed to unregister push token" });
  }
});

export { router as pushRouter };
