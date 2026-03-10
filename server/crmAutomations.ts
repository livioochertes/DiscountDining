import { db } from "./db";
import { eq, and, inArray, lte, gte, sql } from "drizzle-orm";
import {
  crmAutomations, crmSubscriptions, orders, customers,
  customerSpecialDates, tableReservations, restaurants,
  customerCashbackEnrollments, customerLoyaltyEnrollments
} from "@shared/schema";

const recentlySent = new Map<string, number>();

function wasSentRecently(automationId: number, customerId: number, withinHours: number = 24): boolean {
  const key = `${automationId}:${customerId}`;
  const lastSent = recentlySent.get(key);
  if (!lastSent) return false;
  return Date.now() - lastSent < withinHours * 60 * 60 * 1000;
}

function markSent(automationId: number, customerId: number) {
  const key = `${automationId}:${customerId}`;
  recentlySent.set(key, Date.now());
}

function cleanupOldEntries() {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const entries = Array.from(recentlySent.entries());
  for (const [key, timestamp] of entries) {
    if (timestamp < cutoff) recentlySent.delete(key);
  }
}

async function sendMessage(channelType: string, customer: any, restaurantName: string, subject: string, message: string) {
  const customerName = customer.firstName || customer.name || '';
  const firstName = customer.firstName || (customer.name ? customer.name.split(' ')[0] : '');
  const personalizedMessage = message
    .replace(/\{customer_name\}/g, customerName.trim())
    .replace(/\{first_name\}/g, firstName)
    .replace(/\{restaurant_name\}/g, restaurantName);

  try {
    if (channelType === "push") {
      const { sendPushToCustomer } = await import('./pushNotifications');
      await sendPushToCustomer(customer.id, subject, personalizedMessage);
      return true;
    } else if (channelType === "email" && customer.email) {
      const sgMail = (await import('@sendgrid/mail')).default;
      if (process.env.SENDGRID_API_KEY) {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        await sgMail.send({
          to: customer.email,
          from: 'no-replay@eatoff.app',
          subject,
          html: personalizedMessage,
        });
        return true;
      }
    } else if (channelType === "sms" && customer.phone) {
      const { sendSMS } = await import('./smsService');
      await sendSMS(customer.phone, personalizedMessage);
      return true;
    }
  } catch (e) {
    console.error(`[CRM Automation] ${channelType} send failed for customer ${customer.id}:`, e);
  }
  return false;
}

async function getRestaurantCustomerIds(restaurantId: number): Promise<number[]> {
  const cashback = await db
    .select({ customerId: customerCashbackEnrollments.customerId })
    .from(customerCashbackEnrollments)
    .where(eq((customerCashbackEnrollments as any).restaurantId, restaurantId));
  const loyalty = await db
    .select({ customerId: customerLoyaltyEnrollments.customerId })
    .from(customerLoyaltyEnrollments)
    .where(eq(customerLoyaltyEnrollments.restaurantId, restaurantId));
  const ids = new Set([
    ...cashback.map(e => e.customerId),
    ...loyalty.map(e => e.customerId),
  ]);
  return Array.from(ids);
}

async function processWelcomeAutomation(automation: any, restaurantName: string) {
  const customerIds = await getRestaurantCustomerIds(automation.restaurantId);
  if (customerIds.length === 0) return;

  const delayMs = (automation.delayHours || 1) * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - delayMs);
  const recentCutoff = new Date(Date.now() - delayMs - 24 * 60 * 60 * 1000);

  const allOrders = await db
    .select({
      customerId: orders.customerId,
      orderDate: orders.orderDate,
    })
    .from(orders)
    .where(and(
      eq(orders.restaurantId, automation.restaurantId),
      inArray(orders.customerId, customerIds),
    ));

  const orderCountByCustomer = new Map<number, { count: number; firstOrderDate: Date | null }>();
  for (const o of allOrders) {
    const cid = o.customerId!;
    const existing = orderCountByCustomer.get(cid);
    if (!existing) {
      orderCountByCustomer.set(cid, { count: 1, firstOrderDate: o.orderDate });
    } else {
      existing.count++;
      if (o.orderDate && (!existing.firstOrderDate || o.orderDate < existing.firstOrderDate)) {
        existing.firstOrderDate = o.orderDate;
      }
    }
  }

  const entries = Array.from(orderCountByCustomer.entries());
  for (const [customerId, stats] of entries) {
    if (stats.count === 1 && stats.firstOrderDate && stats.firstOrderDate <= cutoff && stats.firstOrderDate >= recentCutoff) {
      if (wasSentRecently(automation.id, customerId, 168)) continue;

      const customerList = await db.select().from(customers).where(eq(customers.id, customerId)).limit(1);
      if (customerList[0]) {
        const sent = await sendMessage(automation.channelType, customerList[0], restaurantName, "Welcome!", automation.messageTemplate);
        if (sent) markSent(automation.id, customerId);
      }
    }
  }
}

async function processPostVisitAutomation(automation: any, restaurantName: string) {
  const delayMs = (automation.delayHours || 24) * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - delayMs);
  const windowStart = new Date(cutoff.getTime() - 60 * 60 * 1000);

  const completedOrders = await db
    .select({ customerId: orders.customerId, id: orders.id })
    .from(orders)
    .where(and(
      eq(orders.restaurantId, automation.restaurantId),
      eq(orders.status, "completed"),
      gte(orders.completedAt, windowStart),
      lte(orders.completedAt, cutoff),
    ));

  for (const order of completedOrders) {
    if (!order.customerId) continue;
    if (wasSentRecently(automation.id, order.customerId, 48)) continue;

    const customerList = await db.select().from(customers).where(eq(customers.id, order.customerId)).limit(1);
    if (customerList[0]) {
      const sent = await sendMessage(automation.channelType, customerList[0], restaurantName, "Thank you for your visit!", automation.messageTemplate);
      if (sent) markSent(automation.id, order.customerId);
    }
  }
}

async function processBirthdayAutomation(automation: any, restaurantName: string) {
  const today = new Date();
  const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const specialDates = await db
    .select()
    .from(customerSpecialDates)
    .where(and(
      eq(customerSpecialDates.restaurantId, automation.restaurantId),
      eq(customerSpecialDates.dateType, "birthday"),
    ));

  for (const sd of specialDates) {
    if (!sd.eventDate) continue;
    const eventDate = new Date(sd.eventDate);
    const eventStr = `${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
    if (eventStr !== todayStr) continue;

    if (wasSentRecently(automation.id, sd.customerId, 24 * 365)) continue;

    const customerList = await db.select().from(customers).where(eq(customers.id, sd.customerId)).limit(1);
    if (customerList[0]) {
      const sent = await sendMessage(automation.channelType, customerList[0], restaurantName, "Happy Birthday! 🎂", automation.messageTemplate);
      if (sent) markSent(automation.id, sd.customerId);
    }
  }
}

async function processInactiveReengagementAutomation(automation: any, restaurantName: string) {
  const customerIds = await getRestaurantCustomerIds(automation.restaurantId);
  if (customerIds.length === 0) return;

  const inactivityMs = (automation.inactivityDays || 60) * 24 * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - inactivityMs);

  const customerOrders = await db
    .select({
      customerId: orders.customerId,
      lastOrder: sql<Date>`max(${orders.orderDate})`,
    })
    .from(orders)
    .where(and(
      eq(orders.restaurantId, automation.restaurantId),
      inArray(orders.customerId, customerIds),
    ))
    .groupBy(orders.customerId);

  for (const co of customerOrders) {
    if (!co.customerId || !co.lastOrder) continue;
    const lastOrderDate = new Date(co.lastOrder);
    if (lastOrderDate > cutoff) continue;

    if (wasSentRecently(automation.id, co.customerId, 168)) continue;

    const customerList = await db.select().from(customers).where(eq(customers.id, co.customerId)).limit(1);
    if (customerList[0]) {
      const sent = await sendMessage(automation.channelType, customerList[0], restaurantName, "We miss you!", automation.messageTemplate);
      if (sent) markSent(automation.id, co.customerId);
    }
  }
}

async function processReservationFollowupAutomation(automation: any, restaurantName: string) {
  const delayMs = (automation.delayHours || 2) * 60 * 60 * 1000;
  const cutoff = new Date(Date.now() - delayMs);
  const windowStart = new Date(cutoff.getTime() - 60 * 60 * 1000);

  const completedReservations = await db
    .select({ customerId: tableReservations.customerId })
    .from(tableReservations)
    .where(and(
      eq(tableReservations.restaurantId, automation.restaurantId),
      eq(tableReservations.status, "completed"),
      gte(tableReservations.reservationDate, windowStart),
      lte(tableReservations.reservationDate, cutoff),
    ));

  for (const r of completedReservations) {
    if (!r.customerId) continue;
    if (wasSentRecently(automation.id, r.customerId, 48)) continue;

    const customerList = await db.select().from(customers).where(eq(customers.id, r.customerId)).limit(1);
    if (customerList[0]) {
      const sent = await sendMessage(automation.channelType, customerList[0], restaurantName, "Thanks for dining with us!", automation.messageTemplate);
      if (sent) markSent(automation.id, r.customerId);
    }
  }
}

async function runAutomationCycle() {
  try {
    const activeSubscriptions = await db
      .select({ restaurantId: crmSubscriptions.restaurantId, plan: crmSubscriptions.plan })
      .from(crmSubscriptions)
      .where(eq(crmSubscriptions.status, "active"));

    const professionalPlans = activeSubscriptions
      .filter(s => ["professional", "enterprise"].includes(s.plan))
      .map(s => s.restaurantId);

    if (professionalPlans.length === 0) return;

    const activeAutomations = await db
      .select()
      .from(crmAutomations)
      .where(and(
        eq(crmAutomations.isActive, true),
        inArray(crmAutomations.restaurantId, professionalPlans),
      ));

    if (activeAutomations.length === 0) return;

    const restaurantIdSet = new Set(activeAutomations.map(a => a.restaurantId));
    const restaurantIds = Array.from(restaurantIdSet);
    const restaurantList = await db
      .select({ id: restaurants.id, name: restaurants.name })
      .from(restaurants)
      .where(inArray(restaurants.id, restaurantIds));
    const restaurantMap = new Map(restaurantList.map(r => [r.id, r.name]));

    for (const automation of activeAutomations) {
      const restaurantName = restaurantMap.get(automation.restaurantId) || "Restaurant";
      try {
        switch (automation.triggerType) {
          case "welcome":
            await processWelcomeAutomation(automation, restaurantName);
            break;
          case "post_order":
            await processPostVisitAutomation(automation, restaurantName);
            break;
          case "birthday":
            await processBirthdayAutomation(automation, restaurantName);
            break;
          case "inactive_reengagement":
            await processInactiveReengagementAutomation(automation, restaurantName);
            break;
          case "reservation_followup":
            await processReservationFollowupAutomation(automation, restaurantName);
            break;
        }
      } catch (err) {
        console.error(`[CRM Automation] Error processing ${automation.triggerType} for restaurant ${automation.restaurantId}:`, err);
      }
    }

    cleanupOldEntries();
  } catch (error) {
    console.error("[CRM Automation] Cycle error:", error);
  }
}

let automationInterval: ReturnType<typeof setInterval> | null = null;

export function startAutomationRunner() {
  if (automationInterval) return;
  console.log("[CRM Automation] Starting periodic automation runner (every 60 minutes)");
  automationInterval = setInterval(runAutomationCycle, 60 * 60 * 1000);
  setTimeout(runAutomationCycle, 30 * 1000);
}

export function stopAutomationRunner() {
  if (automationInterval) {
    clearInterval(automationInterval);
    automationInterval = null;
    console.log("[CRM Automation] Stopped automation runner");
  }
}
