import { Router, Request, Response } from "express";
import Stripe from "stripe";
import { db } from "./db";
import { storage } from "./storage";
import { eq, and, sql, desc, asc, gte, lte, ilike, or, inArray, count } from "drizzle-orm";
import {
  crmPlans, crmSubscriptions, customerFeedback, customerSegments,
  customerSegmentMembers, crmCampaigns, crmCampaignRecipients,
  customerSpecialDates, customerCrmNotes, crmAutomations,
  customers, orders, orderItems, restaurants, menuItems,
  customerCashbackEnrollments, customerLoyaltyEnrollments,
  cashbackGroups,
  tableReservations, restaurantOwners
} from "@shared/schema";

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-06-30.basil" });
}

const crmRouter = Router();

const CRM_PLAN_FEATURES: Record<string, string[]> = {
  free: ["customer_list", "basic_view"],
  starter: ["customer_list", "customer_profiles", "feedback", "segments", "notes", "special_dates"],
  professional: ["customer_list", "customer_profiles", "feedback", "segments", "notes", "special_dates", "campaigns", "automations", "analytics"],
  enterprise: ["customer_list", "customer_profiles", "feedback", "segments", "notes", "special_dates", "campaigns", "automations", "analytics", "api_access", "priority_support"],
};

const CRM_PLAN_LIMITS: Record<string, { maxCustomers: number; maxCampaigns: number; maxSegments: number }> = {
  free: { maxCustomers: 50, maxCampaigns: 0, maxSegments: 0 },
  starter: { maxCustomers: 200, maxCampaigns: 0, maxSegments: 5 },
  professional: { maxCustomers: 1000, maxCampaigns: 10, maxSegments: 50 },
  enterprise: { maxCustomers: 999999, maxCampaigns: 999999, maxSegments: 999999 },
};

function getOwnerId(req: Request): number | null {
  const session = req as any;
  return session.session?.ownerId || null;
}

async function getSubscriptionPlan(restaurantId: number): Promise<string> {
  const sub = await db
    .select({ plan: crmSubscriptions.plan, status: crmSubscriptions.status })
    .from(crmSubscriptions)
    .where(and(eq(crmSubscriptions.restaurantId, restaurantId), eq(crmSubscriptions.status, "active")))
    .limit(1);
  return sub[0]?.plan || "free";
}

function hasFeature(plan: string, feature: string): boolean {
  return (CRM_PLAN_FEATURES[plan] || []).includes(feature);
}

function requireCrmFeature(feature: string) {
  return async (req: Request, res: Response, next: Function) => {
    const ownerId = getOwnerId(req);
    if (!ownerId) return res.status(401).json({ message: "Not authenticated" });

    const restaurantId = parseInt(req.params.restaurantId);
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });

    const ownerRestaurants = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, ownerId));

    if (!ownerRestaurants.find(r => r.id === restaurantId)) {
      return res.status(403).json({ message: "Not authorized for this restaurant" });
    }

    const plan = await getSubscriptionPlan(restaurantId);
    if (!hasFeature(plan, feature)) {
      return res.status(403).json({
        message: "This feature requires a higher CRM plan",
        currentPlan: plan,
        requiredFeature: feature,
        upgradeRequired: true
      });
    }

    (req as any).crmPlan = plan;
    next();
  };
}

function requireRestaurantOwner() {
  return async (req: Request, res: Response, next: Function) => {
    const ownerId = getOwnerId(req);
    if (!ownerId) return res.status(401).json({ message: "Not authenticated" });

    const restaurantId = parseInt(req.params.restaurantId);
    if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });

    const ownerRestaurants = await db
      .select({ id: restaurants.id })
      .from(restaurants)
      .where(eq(restaurants.ownerId, ownerId));

    if (!ownerRestaurants.find(r => r.id === restaurantId)) {
      return res.status(403).json({ message: "Not authorized for this restaurant" });
    }

    (req as any).ownerId = ownerId;
    next();
  };
}

crmRouter.get("/plans", async (_req: Request, res: Response) => {
  try {
    const plans = await db.select().from(crmPlans).where(eq(crmPlans.isActive, true));
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/subscription/:restaurantId", requireRestaurantOwner(), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const sub = await db
      .select()
      .from(crmSubscriptions)
      .where(eq(crmSubscriptions.restaurantId, restaurantId))
      .orderBy(desc(crmSubscriptions.createdAt))
      .limit(1);

    if (!sub[0]) {
      return res.json({
        plan: "free",
        status: "active",
        features: CRM_PLAN_FEATURES.free,
        limits: CRM_PLAN_LIMITS.free
      });
    }

    const plan = sub[0].plan;
    res.json({
      ...sub[0],
      features: CRM_PLAN_FEATURES[plan] || CRM_PLAN_FEATURES.free,
      limits: CRM_PLAN_LIMITS[plan] || CRM_PLAN_LIMITS.free
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/subscribe", async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) return res.status(401).json({ message: "Not authenticated" });

    if (!stripe) return res.status(500).json({ message: "Stripe not configured" });

    const { restaurantId, planSlug, billingPeriod = "monthly" } = req.body;
    if (!restaurantId || !planSlug) {
      return res.status(400).json({ message: "restaurantId and planSlug required" });
    }

    const ownerRestaurants = await db.select({ id: restaurants.id }).from(restaurants)
      .where(eq(restaurants.ownerId, ownerId));
    if (!ownerRestaurants.find(r => r.id === parseInt(restaurantId))) {
      return res.status(403).json({ message: "Not authorized for this restaurant" });
    }

    const plan = await db
      .select()
      .from(crmPlans)
      .where(and(eq(crmPlans.slug, planSlug), eq(crmPlans.isActive, true)))
      .limit(1);

    if (!plan[0]) return res.status(404).json({ message: "Plan not found" });

    const owner = await db
      .select()
      .from(restaurantOwners)
      .where(eq(restaurantOwners.id, ownerId))
      .limit(1);

    if (!owner[0]) return res.status(404).json({ message: "Owner not found" });

    const priceId = billingPeriod === "yearly"
      ? plan[0].stripePriceIdYearly
      : plan[0].stripePriceIdMonthly;

    if (!priceId) {
      const amount = billingPeriod === "yearly"
        ? Math.round(parseFloat(plan[0].yearlyPriceEur) * 100)
        : Math.round(parseFloat(plan[0].monthlyPriceEur) * 100);

      if (amount === 0) {
        await db.insert(crmSubscriptions).values({
          restaurantId: parseInt(restaurantId),
          ownerId,
          plan: planSlug,
          status: "active",
        });
        return res.json({ success: true, message: "Free plan activated" });
      }

      const product = await stripe.products.create({
        name: `EatOff CRM - ${plan[0].name}`,
        description: `CRM ${plan[0].name} plan for restaurant management`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount,
        currency: "eur",
        recurring: { interval: billingPeriod === "yearly" ? "year" : "month" },
      });

      await db.update(crmPlans).set(
        billingPeriod === "yearly"
          ? { stripePriceIdYearly: price.id }
          : { stripePriceIdMonthly: price.id }
      ).where(eq(crmPlans.id, plan[0].id));

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${req.headers.origin || req.protocol + '://' + req.get('host')}/restaurant-portal?crm_subscribed=true&plan=${planSlug}`,
        cancel_url: `${req.headers.origin || req.protocol + '://' + req.get('host')}/restaurant-portal?crm_cancelled=true`,
        metadata: { restaurantId: String(restaurantId), ownerId: String(ownerId), planSlug },
        customer_email: owner[0].email,
      });

      return res.json({ url: session.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${req.headers.origin || req.protocol + '://' + req.get('host')}/restaurant-portal?crm_subscribed=true&plan=${planSlug}`,
      cancel_url: `${req.headers.origin || req.protocol + '://' + req.get('host')}/restaurant-portal?crm_cancelled=true`,
      metadata: { restaurantId: String(restaurantId), ownerId: String(ownerId), planSlug },
      customer_email: owner[0].email,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("[CRM Subscribe] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/subscription/cancel", async (req: Request, res: Response) => {
  try {
    const ownerId = getOwnerId(req);
    if (!ownerId) return res.status(401).json({ message: "Not authenticated" });

    const { restaurantId } = req.body;
    const ownerRestaurants = await db.select({ id: restaurants.id }).from(restaurants)
      .where(eq(restaurants.ownerId, ownerId));
    if (!ownerRestaurants.find(r => r.id === parseInt(restaurantId))) {
      return res.status(403).json({ message: "Not authorized for this restaurant" });
    }

    const sub = await db
      .select()
      .from(crmSubscriptions)
      .where(and(eq(crmSubscriptions.restaurantId, parseInt(restaurantId)), eq(crmSubscriptions.status, "active")))
      .limit(1);

    if (!sub[0]) return res.status(404).json({ message: "No active subscription" });

    if (sub[0].stripeSubscriptionId && stripe) {
      await stripe.subscriptions.update(sub[0].stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    await db.update(crmSubscriptions).set({
      cancelAtPeriodEnd: true,
      updatedAt: new Date(),
    }).where(eq(crmSubscriptions.id, sub[0].id));

    res.json({ success: true, message: "Subscription will cancel at period end" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/customers/:restaurantId", requireCrmFeature("customer_list"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const plan = (req as any).crmPlan || "free";
    const { search, sort = "totalSpent", order = "desc", page = "1", limit = "20", segmentId } = req.query as any;

    const cashbackEnrollments = await db
      .select({
        customerId: customerCashbackEnrollments.customerId,
        totalSpendInGroup: customerCashbackEnrollments.totalSpendInGroup,
        enrolledAt: customerCashbackEnrollments.enrolledAt,
      })
      .from(customerCashbackEnrollments)
      .innerJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
      .where(eq(cashbackGroups.restaurantId, restaurantId));

    const loyaltyEnrollments = await db
      .select({
        customerId: customerLoyaltyEnrollments.customerId,
        totalSpentAtRestaurant: customerLoyaltyEnrollments.totalSpentAtRestaurant,
        enrolledAt: customerLoyaltyEnrollments.enrolledAt,
      })
      .from(customerLoyaltyEnrollments)
      .where(eq(customerLoyaltyEnrollments.restaurantId, restaurantId));

    const enrolledCustomerIds = new Set([
      ...cashbackEnrollments.map(e => e.customerId),
      ...loyaltyEnrollments.map(e => e.customerId),
    ]);

    if (enrolledCustomerIds.size === 0) {
      return res.json({ customers: [], total: 0, page: 1, totalPages: 0 });
    }

    const customerIds = Array.from(enrolledCustomerIds);
    let customerList = await db
      .select()
      .from(customers)
      .where(inArray(customers.id, customerIds));

    if (search) {
      const s = search.toLowerCase();
      customerList = customerList.filter(c =>
        c.name?.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.phone?.includes(s)
      );
    }

    const customerOrders = await db
      .select({
        customerId: orders.customerId,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate,
      })
      .from(orders)
      .where(and(
        eq(orders.restaurantId, restaurantId),
        inArray(orders.customerId, customerIds)
      ));

    const ordersByCustomer = new Map<number, { count: number; total: number; lastDate: Date | null }>();
    for (const o of customerOrders) {
      const cid = o.customerId!;
      const existing = ordersByCustomer.get(cid) || { count: 0, total: 0, lastDate: null };
      existing.count++;
      existing.total += parseFloat(o.totalAmount || "0");
      if (!existing.lastDate || (o.orderDate && o.orderDate > existing.lastDate)) {
        existing.lastDate = o.orderDate;
      }
      ordersByCustomer.set(cid, existing);
    }

    let segmentCustomerIds: Set<number> | null = null;
    if (segmentId) {
      const members = await db
        .select({ customerId: customerSegmentMembers.customerId })
        .from(customerSegmentMembers)
        .where(eq(customerSegmentMembers.segmentId, parseInt(segmentId)));
      segmentCustomerIds = new Set(members.map(m => m.customerId));
    }

    const enriched = customerList
      .filter(c => !segmentCustomerIds || segmentCustomerIds.has(c.id))
      .map(c => {
        const stats = ordersByCustomer.get(c.id) || { count: 0, total: 0, lastDate: null };
        const cashEnrollment = cashbackEnrollments.find(e => e.customerId === c.id);
        const loyalEnrollment = loyaltyEnrollments.find(e => e.customerId === c.id);
        return {
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          profilePicture: c.profilePicture,
          customerCode: c.customerCode,
          loyaltyPoints: c.loyaltyPoints || 0,
          totalSpent: stats.total,
          orderCount: stats.count,
          avgOrderValue: stats.count > 0 ? stats.total / stats.count : 0,
          lastOrderDate: stats.lastDate,
          enrolledAt: cashEnrollment?.enrolledAt || loyalEnrollment?.enrolledAt,
          hasCashback: !!cashEnrollment,
          hasLoyalty: !!loyalEnrollment,
        };
      });

    enriched.sort((a, b) => {
      const key = sort as keyof typeof a;
      const aVal = a[key] ?? 0;
      const bVal = b[key] ?? 0;
      if (order === "asc") return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    });

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const total = enriched.length;
    const paged = enriched.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      customers: paged,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    console.error("[CRM Customers] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/customers/:restaurantId/:customerId", requireCrmFeature("customer_profiles"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const customerId = parseInt(req.params.customerId);

    const customer = await storage.getCustomer(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const customerOrdersList = await db
      .select()
      .from(orders)
      .where(and(eq(orders.restaurantId, restaurantId), eq(orders.customerId, customerId)))
      .orderBy(desc(orders.orderDate));

    const reservations = await db
      .select()
      .from(tableReservations)
      .where(and(eq(tableReservations.restaurantId, restaurantId), eq(tableReservations.customerId, customerId)))
      .orderBy(desc(tableReservations.reservationDate));

    const feedback = await db
      .select()
      .from(customerFeedback)
      .where(and(eq(customerFeedback.restaurantId, restaurantId), eq(customerFeedback.customerId, customerId)))
      .orderBy(desc(customerFeedback.createdAt));

    const notes = await db
      .select()
      .from(customerCrmNotes)
      .where(and(eq(customerCrmNotes.restaurantId, restaurantId), eq(customerCrmNotes.customerId, customerId)))
      .orderBy(desc(customerCrmNotes.createdAt));

    const specialDates = await db
      .select()
      .from(customerSpecialDates)
      .where(and(eq(customerSpecialDates.restaurantId, restaurantId), eq(customerSpecialDates.customerId, customerId)));

    const segments = await db
      .select({ segmentId: customerSegmentMembers.segmentId, name: customerSegments.name, segmentType: customerSegments.segmentType })
      .from(customerSegmentMembers)
      .innerJoin(customerSegments, eq(customerSegmentMembers.segmentId, customerSegments.id))
      .where(and(
        eq(customerSegmentMembers.customerId, customerId),
        eq(customerSegments.restaurantId, restaurantId)
      ));

    let favoriteProducts: { name: string; count: number }[] = [];
    if (customerOrdersList.length > 0) {
      const orderIds = customerOrdersList.map(o => o.id);
      const items = await db
        .select({ menuItemId: orderItems.menuItemId, quantity: orderItems.quantity })
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));

      const productCounts = new Map<number, number>();
      for (const item of items) {
        if (item.menuItemId) {
          productCounts.set(item.menuItemId, (productCounts.get(item.menuItemId) || 0) + (item.quantity || 1));
        }
      }

      if (productCounts.size > 0) {
        const menuItemIds = Array.from(productCounts.keys());
        const menuItemsList = await db
          .select({ id: menuItems.id, name: menuItems.name })
          .from(menuItems)
          .where(inArray(menuItems.id, menuItemIds));

        favoriteProducts = menuItemsList
          .map(mi => ({ name: mi.name, count: productCounts.get(mi.id) || 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      }
    }

    const totalSpent = customerOrdersList.reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);
    const orderCount = customerOrdersList.length;

    const hourDistribution = new Array(24).fill(0);
    for (const o of customerOrdersList) {
      if (o.orderDate) hourDistribution[o.orderDate.getHours()]++;
    }

    res.json({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        profilePicture: customer.profilePicture,
        customerCode: customer.customerCode,
        loyaltyPoints: customer.loyaltyPoints || 0,
        dietaryPreferences: customer.dietaryPreferences,
        allergies: customer.allergies,
        createdAt: customer.createdAt,
      },
      stats: {
        totalSpent,
        orderCount,
        avgOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
        lastOrderDate: customerOrdersList[0]?.orderDate || null,
        visitFrequency: orderCount > 0 && customerOrdersList[customerOrdersList.length - 1]?.orderDate
          ? orderCount / Math.max(1, Math.ceil((Date.now() - customerOrdersList[customerOrdersList.length - 1].orderDate!.getTime()) / (1000 * 60 * 60 * 24 * 30)))
          : 0,
      },
      orders: customerOrdersList.slice(0, 20),
      reservations: reservations.slice(0, 20),
      feedback,
      notes,
      specialDates,
      segments,
      favoriteProducts,
      preferredHours: hourDistribution,
    });
  } catch (error: any) {
    console.error("[CRM Customer Detail] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/segments/:restaurantId", requireCrmFeature("customer_list"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const segmentList = await db
      .select()
      .from(customerSegments)
      .where(eq(customerSegments.restaurantId, restaurantId))
      .orderBy(asc(customerSegments.name));

    res.json(segmentList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/segments/:restaurantId", requireCrmFeature("segments"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const plan = (req as any).crmPlan || "free";
    const limits = CRM_PLAN_LIMITS[plan] || CRM_PLAN_LIMITS.free;

    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerSegments)
      .where(and(eq(customerSegments.restaurantId, restaurantId), eq(customerSegments.autoGenerated, false)));

    if (existingCount[0] && Number(existingCount[0].count) >= limits.maxSegments) {
      return res.status(403).json({ message: `Segment limit reached (${limits.maxSegments}). Upgrade your plan.` });
    }

    const { name, segmentType = "custom", criteria = {} } = req.body;
    if (!name) return res.status(400).json({ message: "Segment name required" });

    const [segment] = await db.insert(customerSegments).values({
      restaurantId,
      name,
      segmentType,
      criteria,
      autoGenerated: false,
    }).returning();

    res.json(segment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/segments/:restaurantId/auto-generate", requireCrmFeature("customer_list"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);

    await db.delete(customerSegmentMembers).where(
      inArray(customerSegmentMembers.segmentId,
        db.select({ id: customerSegments.id }).from(customerSegments)
          .where(and(eq(customerSegments.restaurantId, restaurantId), eq(customerSegments.autoGenerated, true)))
      )
    );
    await db.delete(customerSegments).where(
      and(eq(customerSegments.restaurantId, restaurantId), eq(customerSegments.autoGenerated, true))
    );

    const cashbackEnrollments = await db
      .select({ customerId: customerCashbackEnrollments.customerId })
      .from(customerCashbackEnrollments)
      .innerJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
      .where(eq(cashbackGroups.restaurantId, restaurantId));
    const loyaltyEnrollments = await db
      .select({ customerId: customerLoyaltyEnrollments.customerId })
      .from(customerLoyaltyEnrollments)
      .where(eq(customerLoyaltyEnrollments.restaurantId, restaurantId));

    const allCustomerIds = Array.from(new Set([
      ...cashbackEnrollments.map(e => e.customerId),
      ...loyaltyEnrollments.map(e => e.customerId),
    ]));

    if (allCustomerIds.length === 0) {
      return res.json({ message: "No customers enrolled", segments: [] });
    }

    const customerOrders = await db
      .select({
        customerId: orders.customerId,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate,
      })
      .from(orders)
      .where(and(eq(orders.restaurantId, restaurantId), inArray(orders.customerId, allCustomerIds)));

    const stats = new Map<number, { count: number; total: number; lastDate: Date | null; firstDate: Date | null }>();
    for (const cid of allCustomerIds) {
      stats.set(cid, { count: 0, total: 0, lastDate: null, firstDate: null });
    }
    for (const o of customerOrders) {
      const cid = o.customerId!;
      const s = stats.get(cid)!;
      s.count++;
      s.total += parseFloat(o.totalAmount || "0");
      if (!s.lastDate || (o.orderDate && o.orderDate > s.lastDate)) s.lastDate = o.orderDate;
      if (!s.firstDate || (o.orderDate && o.orderDate < s.firstDate)) s.firstDate = o.orderDate;
    }

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000;

    const newCustomers: number[] = [];
    const loyalCustomers: number[] = [];
    const inactiveCustomers: number[] = [];

    const spendingValues = allCustomerIds.map(cid => stats.get(cid)?.total || 0).sort((a, b) => b - a);
    const vipThreshold = spendingValues[Math.floor(spendingValues.length * 0.1)] || 0;

    const vipCustomers: number[] = [];

    for (const cid of allCustomerIds) {
      const s = stats.get(cid)!;

      if (s.firstDate && s.firstDate.getTime() > thirtyDaysAgo) {
        newCustomers.push(cid);
      }

      const recentOrders = customerOrders.filter(o =>
        o.customerId === cid && o.createdAt && o.createdAt.getTime() > ninetyDaysAgo
      );
      if (recentOrders.length >= 5) {
        loyalCustomers.push(cid);
      }

      if (s.count > 0 && (!s.lastDate || s.lastDate.getTime() < sixtyDaysAgo)) {
        inactiveCustomers.push(cid);
      }

      if (s.total >= vipThreshold && vipThreshold > 0) {
        vipCustomers.push(cid);
      }
    }

    const segmentDefs = [
      { name: "Clienți Noi", type: "new", customers: newCustomers, criteria: { firstOrderWithin: 30 } },
      { name: "Clienți Fideli", type: "loyal", customers: loyalCustomers, criteria: { minOrders90Days: 5 } },
      { name: "Clienți Inactivi", type: "inactive", customers: inactiveCustomers, criteria: { noOrderDays: 60 } },
      { name: "Clienți VIP", type: "vip", customers: vipCustomers, criteria: { topSpendersPercent: 10 } },
    ];

    const createdSegments = [];
    for (const def of segmentDefs) {
      const [segment] = await db.insert(customerSegments).values({
        restaurantId,
        name: def.name,
        segmentType: def.type,
        criteria: def.criteria,
        autoGenerated: true,
        memberCount: def.customers.length,
      }).returning();

      if (def.customers.length > 0) {
        await db.insert(customerSegmentMembers).values(
          def.customers.map(cid => ({ segmentId: segment.id, customerId: cid }))
        );
      }

      createdSegments.push({ ...segment, memberCount: def.customers.length });
    }

    res.json({ segments: createdSegments });
  } catch (error: any) {
    console.error("[CRM Auto-Segments] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

crmRouter.delete("/segments/:restaurantId/:segmentId", requireCrmFeature("segments"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const segmentId = parseInt(req.params.segmentId);
    const [seg] = await db.select({ id: customerSegments.id }).from(customerSegments)
      .where(and(eq(customerSegments.id, segmentId), eq(customerSegments.restaurantId, restaurantId)));
    if (!seg) return res.status(404).json({ message: "Segment not found" });
    await db.delete(customerSegmentMembers).where(eq(customerSegmentMembers.segmentId, segmentId));
    await db.delete(customerSegments).where(eq(customerSegments.id, segmentId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/segments/:restaurantId/:segmentId/members", requireCrmFeature("segments"), async (req: Request, res: Response) => {
  try {
    const segmentId = parseInt(req.params.segmentId);
    const members = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        addedAt: customerSegmentMembers.addedAt,
      })
      .from(customerSegmentMembers)
      .innerJoin(customers, eq(customerSegmentMembers.customerId, customers.id))
      .where(eq(customerSegmentMembers.segmentId, segmentId));

    res.json(members);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/segments/:restaurantId/:segmentId/members", requireCrmFeature("segments"), async (req: Request, res: Response) => {
  try {
    const segmentId = parseInt(req.params.segmentId);
    const { customerId } = req.body;
    if (!customerId) return res.status(400).json({ message: "customerId required" });

    await db.insert(customerSegmentMembers).values({ segmentId, customerId });
    await db.update(customerSegments).set({
      memberCount: sql`${customerSegments.memberCount} + 1`,
      updatedAt: new Date(),
    }).where(eq(customerSegments.id, segmentId));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.delete("/segments/:restaurantId/:segmentId/members/:customerId", requireCrmFeature("segments"), async (req: Request, res: Response) => {
  try {
    const segmentId = parseInt(req.params.segmentId);
    const customerId = parseInt(req.params.customerId);

    await db.delete(customerSegmentMembers).where(
      and(eq(customerSegmentMembers.segmentId, segmentId), eq(customerSegmentMembers.customerId, customerId))
    );
    await db.update(customerSegments).set({
      memberCount: sql`GREATEST(${customerSegments.memberCount} - 1, 0)`,
      updatedAt: new Date(),
    }).where(eq(customerSegments.id, segmentId));

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/feedback", async (req: Request, res: Response) => {
  try {
    const { customerId, restaurantId, orderId, reservationId, overallRating, foodRating, serviceRating, ambienceRating, comment } = req.body;
    if (!customerId || !restaurantId || !overallRating) {
      return res.status(400).json({ message: "customerId, restaurantId, and overallRating required" });
    }
    if (overallRating < 1 || overallRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const [fb] = await db.insert(customerFeedback).values({
      customerId,
      restaurantId,
      orderId: orderId || null,
      reservationId: reservationId || null,
      overallRating,
      foodRating: foodRating || null,
      serviceRating: serviceRating || null,
      ambienceRating: ambienceRating || null,
      comment: comment || null,
    }).returning();

    res.json(fb);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/feedback/:restaurantId", requireCrmFeature("feedback"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { minRating, maxRating, page = "1", limit = "20" } = req.query as any;

    let conditions = [eq(customerFeedback.restaurantId, restaurantId)];
    if (minRating) conditions.push(gte(customerFeedback.overallRating, parseInt(minRating)));
    if (maxRating) conditions.push(lte(customerFeedback.overallRating, parseInt(maxRating)));

    const feedbackList = await db
      .select({
        id: customerFeedback.id,
        customerId: customerFeedback.customerId,
        orderId: customerFeedback.orderId,
        overallRating: customerFeedback.overallRating,
        foodRating: customerFeedback.foodRating,
        serviceRating: customerFeedback.serviceRating,
        ambienceRating: customerFeedback.ambienceRating,
        comment: customerFeedback.comment,
        createdAt: customerFeedback.createdAt,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(customerFeedback)
      .innerJoin(customers, eq(customerFeedback.customerId, customers.id))
      .where(and(...conditions))
      .orderBy(desc(customerFeedback.createdAt));

    const avgRatings = await db
      .select({
        avgOverall: sql<number>`ROUND(AVG(overall_rating)::numeric, 1)`,
        avgFood: sql<number>`ROUND(AVG(food_rating)::numeric, 1)`,
        avgService: sql<number>`ROUND(AVG(service_rating)::numeric, 1)`,
        avgAmbience: sql<number>`ROUND(AVG(ambience_rating)::numeric, 1)`,
        totalCount: sql<number>`count(*)`,
      })
      .from(customerFeedback)
      .where(eq(customerFeedback.restaurantId, restaurantId));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const paged = feedbackList.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      feedback: paged,
      averages: avgRatings[0],
      total: feedbackList.length,
      page: pageNum,
      totalPages: Math.ceil(feedbackList.length / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/campaigns/:restaurantId", requireCrmFeature("campaigns"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const campaignsList = await db
      .select()
      .from(crmCampaigns)
      .where(eq(crmCampaigns.restaurantId, restaurantId))
      .orderBy(desc(crmCampaigns.createdAt));

    res.json(campaignsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/campaigns/:restaurantId", requireCrmFeature("campaigns"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const plan = (req as any).crmPlan || "free";
    const limits = CRM_PLAN_LIMITS[plan] || CRM_PLAN_LIMITS.free;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const existingCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(crmCampaigns)
      .where(and(
        eq(crmCampaigns.restaurantId, restaurantId),
        gte(crmCampaigns.createdAt, monthStart)
      ));

    if (Number(existingCount[0]?.count || 0) >= limits.maxCampaigns) {
      return res.status(403).json({ message: `Campaign limit reached (${limits.maxCampaigns}/month). Upgrade your plan.` });
    }

    const { name, channelType, segmentId, subject, messageBody, scheduledAt } = req.body;
    if (!name || !channelType || !messageBody) {
      return res.status(400).json({ message: "name, channelType, and messageBody required" });
    }

    const [campaign] = await db.insert(crmCampaigns).values({
      restaurantId,
      name,
      channelType,
      segmentId: segmentId || null,
      subject: subject || null,
      messageBody,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: scheduledAt ? "scheduled" : "draft",
    }).returning();

    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/campaigns/:restaurantId/:campaignId/send", requireCrmFeature("campaigns"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const campaignId = parseInt(req.params.campaignId);

    const [campaign] = await db.select().from(crmCampaigns)
      .where(and(eq(crmCampaigns.id, campaignId), eq(crmCampaigns.restaurantId, restaurantId)));

    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status === "sent") return res.status(400).json({ message: "Campaign already sent" });

    let recipientIds: number[] = [];
    if (campaign.segmentId) {
      const members = await db
        .select({ customerId: customerSegmentMembers.customerId })
        .from(customerSegmentMembers)
        .where(eq(customerSegmentMembers.segmentId, campaign.segmentId));
      recipientIds = members.map(m => m.customerId);
    } else {
      const cashbackE = await db
        .select({ customerId: customerCashbackEnrollments.customerId })
        .from(customerCashbackEnrollments)
        .innerJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
        .where(eq(cashbackGroups.restaurantId, restaurantId));
      const loyaltyE = await db
        .select({ customerId: customerLoyaltyEnrollments.customerId })
        .from(customerLoyaltyEnrollments)
        .where(eq(customerLoyaltyEnrollments.restaurantId, restaurantId));
      recipientIds = Array.from(new Set([...cashbackE.map(e => e.customerId), ...loyaltyE.map(e => e.customerId)]));
    }

    if (recipientIds.length === 0) {
      return res.status(400).json({ message: "No recipients found" });
    }

    const recipientCustomers = await db
      .select()
      .from(customers)
      .where(inArray(customers.id, recipientIds));

    await db.update(crmCampaigns).set({
      status: "sending",
      recipientCount: recipientIds.length,
    }).where(eq(crmCampaigns.id, campaignId));

    let sentCount = 0;
    for (const customer of recipientCustomers) {
      try {
        const personalizedMessage = campaign.messageBody
          .replace(/\{customer_name\}/g, customer.name || '')
          .replace(/\{first_name\}/g, (customer.name || '').split(' ')[0]);

        if (campaign.channelType === "push") {
          try {
            const { sendPushToCustomer } = await import('./pushNotifications');
            await sendPushToCustomer(customer.id, campaign.subject || campaign.name, personalizedMessage);
            sentCount++;
          } catch (e) {
            console.error(`[CRM Campaign] Push failed for customer ${customer.id}:`, e);
          }
        } else if (campaign.channelType === "email" && customer.email) {
          try {
            const sgMail = (await import('@sendgrid/mail')).default;
            if (process.env.SENDGRID_API_KEY) {
              sgMail.setApiKey(process.env.SENDGRID_API_KEY);
              await sgMail.send({
                to: customer.email,
                from: 'no-replay@eatoff.app',
                subject: campaign.subject || campaign.name,
                html: personalizedMessage,
              });
              sentCount++;
            }
          } catch (e) {
            console.error(`[CRM Campaign] Email failed for customer ${customer.id}:`, e);
          }
        } else if (campaign.channelType === "sms" && customer.phone) {
          try {
            const { sendSMS } = await import('./smsService');
            await sendSMS(customer.phone, personalizedMessage);
            sentCount++;
          } catch (e) {
            console.error(`[CRM Campaign] SMS failed for customer ${customer.id}:`, e);
          }
        }

        await db.insert(crmCampaignRecipients).values({
          campaignId,
          customerId: customer.id,
          status: "sent",
          sentAt: new Date(),
        });
      } catch (e) {
        await db.insert(crmCampaignRecipients).values({
          campaignId,
          customerId: customer.id,
          status: "failed",
        });
      }
    }

    await db.update(crmCampaigns).set({
      status: "sent",
      sentAt: new Date(),
      recipientCount: sentCount,
    }).where(eq(crmCampaigns.id, campaignId));

    res.json({ success: true, sentCount, totalRecipients: recipientIds.length });
  } catch (error: any) {
    console.error("[CRM Campaign Send] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

crmRouter.delete("/campaigns/:restaurantId/:campaignId", requireCrmFeature("campaigns"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const campaignId = parseInt(req.params.campaignId);
    const [camp] = await db.select({ id: crmCampaigns.id }).from(crmCampaigns)
      .where(and(eq(crmCampaigns.id, campaignId), eq(crmCampaigns.restaurantId, restaurantId)));
    if (!camp) return res.status(404).json({ message: "Campaign not found" });
    await db.delete(crmCampaignRecipients).where(eq(crmCampaignRecipients.campaignId, campaignId));
    await db.delete(crmCampaigns).where(eq(crmCampaigns.id, campaignId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/notes/:restaurantId", requireCrmFeature("notes"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const ownerId = (req as any).ownerId || getOwnerId(req);
    const { customerId, noteText } = req.body;
    if (!customerId || !noteText) return res.status(400).json({ message: "customerId and noteText required" });

    const [note] = await db.insert(customerCrmNotes).values({
      customerId,
      restaurantId,
      ownerId,
      noteText,
    }).returning();

    res.json(note);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.delete("/notes/:restaurantId/:noteId", requireCrmFeature("notes"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const noteId = parseInt(req.params.noteId);
    const [note] = await db.select({ id: customerCrmNotes.id }).from(customerCrmNotes)
      .where(and(eq(customerCrmNotes.id, noteId), eq(customerCrmNotes.restaurantId, restaurantId)));
    if (!note) return res.status(404).json({ message: "Note not found" });
    await db.delete(customerCrmNotes).where(eq(customerCrmNotes.id, noteId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/special-dates/:restaurantId", requireCrmFeature("special_dates"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { customerId, dateType, eventDate, label } = req.body;
    if (!customerId || !dateType || !eventDate) {
      return res.status(400).json({ message: "customerId, dateType, and eventDate required" });
    }

    const [date] = await db.insert(customerSpecialDates).values({
      customerId,
      restaurantId,
      dateType,
      eventDate,
      label: label || null,
    }).returning();

    res.json(date);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.delete("/special-dates/:restaurantId/:dateId", requireCrmFeature("special_dates"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const dateId = parseInt(req.params.dateId);
    const [sd] = await db.select({ id: customerSpecialDates.id }).from(customerSpecialDates)
      .where(and(eq(customerSpecialDates.id, dateId), eq(customerSpecialDates.restaurantId, restaurantId)));
    if (!sd) return res.status(404).json({ message: "Special date not found" });
    await db.delete(customerSpecialDates).where(eq(customerSpecialDates.id, dateId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/automations/:restaurantId", requireCrmFeature("automations"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const automationsList = await db
      .select()
      .from(crmAutomations)
      .where(eq(crmAutomations.restaurantId, restaurantId));

    res.json(automationsList);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/automations/:restaurantId", requireCrmFeature("automations"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { triggerType, channelType, messageTemplate, delayHours = 24, isActive = false, inactivityDays = 60 } = req.body;

    if (!triggerType || !channelType || !messageTemplate) {
      return res.status(400).json({ message: "triggerType, channelType, and messageTemplate required" });
    }

    const existing = await db.select().from(crmAutomations)
      .where(and(eq(crmAutomations.restaurantId, restaurantId), eq(crmAutomations.triggerType, triggerType)))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db.update(crmAutomations).set({
        channelType,
        messageTemplate,
        delayHours,
        isActive,
        inactivityDays,
      }).where(eq(crmAutomations.id, existing[0].id)).returning();
      return res.json(updated);
    }

    const [automation] = await db.insert(crmAutomations).values({
      restaurantId,
      triggerType,
      channelType,
      messageTemplate,
      delayHours,
      isActive,
      inactivityDays,
    }).returning();

    res.json(automation);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.patch("/automations/:restaurantId/:automationId", requireCrmFeature("automations"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const automationId = parseInt(req.params.automationId);
    const { isActive, channelType, messageTemplate, delayHours, inactivityDays } = req.body;

    const [auto] = await db.select({ id: crmAutomations.id }).from(crmAutomations)
      .where(and(eq(crmAutomations.id, automationId), eq(crmAutomations.restaurantId, restaurantId)));
    if (!auto) return res.status(404).json({ message: "Automation not found" });

    const updates: any = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (channelType) updates.channelType = channelType;
    if (messageTemplate) updates.messageTemplate = messageTemplate;
    if (delayHours !== undefined) updates.delayHours = delayHours;
    if (inactivityDays !== undefined) updates.inactivityDays = inactivityDays;

    const [updated] = await db.update(crmAutomations).set(updates)
      .where(eq(crmAutomations.id, automationId)).returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

crmRouter.get("/analytics/:restaurantId", requireCrmFeature("analytics"), async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);

    const cashbackE = await db
      .select({ customerId: customerCashbackEnrollments.customerId })
      .from(customerCashbackEnrollments)
      .innerJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
      .where(eq(cashbackGroups.restaurantId, restaurantId));
    const loyaltyE = await db
      .select({ customerId: customerLoyaltyEnrollments.customerId })
      .from(customerLoyaltyEnrollments)
      .where(eq(customerLoyaltyEnrollments.restaurantId, restaurantId));

    const allCustomerIds = Array.from(new Set([
      ...cashbackE.map(e => e.customerId),
      ...loyaltyE.map(e => e.customerId),
    ]));

    const totalCustomers = allCustomerIds.length;

    if (totalCustomers === 0) {
      return res.json({
        totalCustomers: 0,
        newThisMonth: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        avgClv: 0,
        retentionRate: 0,
        retentionRates: { days30: 0, days60: 0, days90: 0 },
        clvDistribution: [],
        segmentDistribution: [],
        revenueBySegment: [],
        visitFrequency: [],
        topCustomers: [],
        revenueByMonth: [],
        campaignPerformance: [],
      });
    }

    const allOrders = await db
      .select({
        customerId: orders.customerId,
        totalAmount: orders.totalAmount,
        orderDate: orders.orderDate,
      })
      .from(orders)
      .where(and(eq(orders.restaurantId, restaurantId), inArray(orders.customerId, allCustomerIds)));

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const customerStats = new Map<number, { total: number; count: number; lastDate: Date | null; firstDate: Date | null }>();
    for (const cid of allCustomerIds) {
      customerStats.set(cid, { total: 0, count: 0, lastDate: null, firstDate: null });
    }
    for (const o of allOrders) {
      const s = customerStats.get(o.customerId!)!;
      s.total += parseFloat(o.totalAmount || "0");
      s.count++;
      if (!s.lastDate || (o.orderDate && o.orderDate > s.lastDate)) s.lastDate = o.orderDate;
      if (!s.firstDate || (o.orderDate && o.orderDate < s.firstDate)) s.firstDate = o.orderDate;
    }

    let activeCustomers = 0;
    let inactiveCustomers = 0;
    let clvSum = 0;
    let returnedCount = 0;
    let returned30 = 0;
    let returned60 = 0;
    let returned90 = 0;
    let customersWithOrders = 0;

    const topCustomersList: { id: number; totalSpent: number; orderCount: number }[] = [];
    const clvValues: number[] = [];

    customerStats.forEach((s, cid) => {
      clvSum += s.total;
      clvValues.push(s.total);
      topCustomersList.push({ id: cid, totalSpent: s.total, orderCount: s.count });

      if (s.lastDate && s.lastDate > thirtyDaysAgo) {
        activeCustomers++;
      } else if (s.count > 0) {
        inactiveCustomers++;
      }

      if (s.count >= 2) {
        returnedCount++;
        if (s.lastDate && s.lastDate > thirtyDaysAgo) returned30++;
        if (s.lastDate && s.lastDate > sixtyDaysAgo) returned60++;
        if (s.lastDate && s.lastDate > ninetyDaysAgo) returned90++;
      }

      if (s.count > 0) customersWithOrders++;
    });

    const retentionRates = {
      days30: customersWithOrders > 0 ? Math.round((returned30 / customersWithOrders) * 100) : 0,
      days60: customersWithOrders > 0 ? Math.round((returned60 / customersWithOrders) * 100) : 0,
      days90: customersWithOrders > 0 ? Math.round((returned90 / customersWithOrders) * 100) : 0,
    };

    const clvBuckets = [
      { label: "€0", min: 0, max: 0.01 },
      { label: "€1-50", min: 0.01, max: 50 },
      { label: "€50-100", min: 50, max: 100 },
      { label: "€100-250", min: 100, max: 250 },
      { label: "€250-500", min: 250, max: 500 },
      { label: "€500-1000", min: 500, max: 1000 },
      { label: "€1000+", min: 1000, max: Infinity },
    ];
    const clvDistribution = clvBuckets.map(b => ({
      range: b.label,
      count: clvValues.filter(v => v >= b.min && v < b.max).length,
    }));

    const newEnrollments = await db
      .select({ count: sql<number>`count(*)` })
      .from(customerCashbackEnrollments)
      .innerJoin(cashbackGroups, eq(customerCashbackEnrollments.groupId, cashbackGroups.id))
      .where(and(
        eq(cashbackGroups.restaurantId, restaurantId),
        gte(customerCashbackEnrollments.enrolledAt, monthStart)
      ));

    const segmentList = await db
      .select({ id: customerSegments.id, name: customerSegments.name, segmentType: customerSegments.segmentType, memberCount: customerSegments.memberCount })
      .from(customerSegments)
      .where(eq(customerSegments.restaurantId, restaurantId));

    const revenueBySegment: { name: string; segmentType: string; revenue: number; memberCount: number }[] = [];
    for (const seg of segmentList) {
      const members = await db
        .select({ customerId: customerSegmentMembers.customerId })
        .from(customerSegmentMembers)
        .where(eq(customerSegmentMembers.segmentId, seg.id));
      const memberIds = members.map(m => m.customerId);
      let segRevenue = 0;
      for (const mid of memberIds) {
        const stats = customerStats.get(mid);
        if (stats) segRevenue += stats.total;
      }
      revenueBySegment.push({
        name: seg.name,
        segmentType: seg.segmentType,
        revenue: Math.round(segRevenue * 100) / 100,
        memberCount: seg.memberCount || 0,
      });
    }
    revenueBySegment.sort((a, b) => b.revenue - a.revenue);

    const visitFrequency: { month: string; avgVisits: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthOrders = allOrders.filter(o => o.orderDate && o.orderDate >= m && o.orderDate <= mEnd);
      const uniqueCustomers = new Set(monthOrders.map(o => o.customerId)).size;
      visitFrequency.push({
        month: m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        avgVisits: uniqueCustomers > 0 ? Math.round((monthOrders.length / uniqueCustomers) * 100) / 100 : 0,
      });
    }

    topCustomersList.sort((a, b) => b.totalSpent - a.totalSpent);
    const top10 = topCustomersList.slice(0, 10);
    const topCustomerDetails = top10.length > 0
      ? await db.select({ id: customers.id, name: customers.name, email: customers.email })
          .from(customers)
          .where(inArray(customers.id, top10.map(t => t.id)))
      : [];

    const topCustomersEnriched = top10.map(t => {
      const details = topCustomerDetails.find(d => d.id === t.id);
      return { ...t, name: details?.name, email: details?.email };
    });

    const revenueByMonth: { month: string; revenue: number; orders: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthOrders = allOrders.filter(o => o.orderDate && o.orderDate >= m && o.orderDate <= mEnd);
      revenueByMonth.push({
        month: m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthOrders.reduce((s, o) => s + parseFloat(o.totalAmount || "0"), 0),
        orders: monthOrders.length,
      });
    }

    const campaignList = await db
      .select({
        id: crmCampaigns.id,
        name: crmCampaigns.name,
        channelType: crmCampaigns.channelType,
        status: crmCampaigns.status,
        recipientCount: crmCampaigns.recipientCount,
        openCount: crmCampaigns.openCount,
        sentAt: crmCampaigns.sentAt,
      })
      .from(crmCampaigns)
      .where(and(eq(crmCampaigns.restaurantId, restaurantId), eq(crmCampaigns.status, "sent")))
      .orderBy(desc(crmCampaigns.sentAt))
      .limit(10);

    const campaignPerformance = campaignList.map(c => ({
      name: c.name,
      channel: c.channelType,
      sent: c.recipientCount || 0,
      opened: c.openCount || 0,
      openRate: c.recipientCount && c.recipientCount > 0 ? Math.round(((c.openCount || 0) / c.recipientCount) * 100) : 0,
      sentAt: c.sentAt,
    }));

    res.json({
      totalCustomers,
      newThisMonth: Number(newEnrollments[0]?.count || 0),
      activeCustomers,
      inactiveCustomers,
      avgClv: totalCustomers > 0 ? Math.round((clvSum / totalCustomers) * 100) / 100 : 0,
      retentionRate: totalCustomers > 0 ? Math.round((returnedCount / totalCustomers) * 100) : 0,
      retentionRates,
      clvDistribution,
      segmentDistribution: segmentList,
      revenueBySegment,
      visitFrequency,
      topCustomers: topCustomersEnriched,
      revenueByMonth,
      campaignPerformance,
    });
  } catch (error: any) {
    console.error("[CRM Analytics] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

crmRouter.post("/webhook", async (req: Request, res: Response) => {
  try {
    if (!stripe) return res.status(500).json({ message: "Stripe not configured" });

    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.CRM_STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;
    if (webhookSecret && sig) {
      try {
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } catch (err: any) {
        console.error("[CRM Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ message: "Webhook signature verification failed" });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({ message: "Webhook secret not configured" });
    } else {
      event = req.body as Stripe.Event;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const { restaurantId, ownerId, planSlug } = session.metadata || {};
        if (restaurantId && ownerId && planSlug) {
          await db.insert(crmSubscriptions).values({
            restaurantId: parseInt(restaurantId),
            ownerId: parseInt(ownerId),
            plan: planSlug,
            status: "active",
            stripeSubscriptionId: session.subscription as string,
            stripeCustomerId: session.customer as string,
          });
          console.log(`[CRM Webhook] Subscription created: restaurant=${restaurantId}, plan=${planSlug}`);
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          await db.update(crmSubscriptions).set({
            status: "active",
            currentPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : undefined,
            currentPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : undefined,
            updatedAt: new Date(),
          }).where(eq(crmSubscriptions.stripeSubscriptionId, subId));
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription as string;
        if (subId) {
          await db.update(crmSubscriptions).set({
            status: "past_due",
            updatedAt: new Date(),
          }).where(eq(crmSubscriptions.stripeSubscriptionId, subId));
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await db.update(crmSubscriptions).set({
          status: "cancelled",
          updatedAt: new Date(),
        }).where(eq(crmSubscriptions.stripeSubscriptionId, sub.id));
        break;
      }
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error("[CRM Webhook] Error:", error);
    res.status(500).json({ message: error.message });
  }
});

export { crmRouter };
