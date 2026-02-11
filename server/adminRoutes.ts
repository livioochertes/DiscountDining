import type { Express, Request, Response } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { 
  eatoffAdmins, 
  adminSessions, 
  auditLogs, 
  restaurants,
  customers,
  restaurantOwners,
  menuItems,
  voucherPackages,
  eatoffVouchers,
  marketplaces,
  insertMarketplaceSchema,
  walletTransactions,
  paymentTransactions,
  geonamesCities,
  chefProfiles,
  mobileFilters,
  insertMobileFilterSchema,
  eatoffLoyaltyTiers,
  restaurantSettlements,
  walletAdjustments,
  customerWallets,
  marketingDeals,
  marketingDealRestaurants,
  insertMarketingDealSchema
} from "@shared/schema";
import { eq, and, gte, desc, sql, ilike, asc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectStorageService } from "./objectStorage";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

interface AdminAuthRequest extends Request {
  adminId?: number;
  admin?: any;
}

// Schema for voucher package validation
const validateVoucherPackage = (data: any) => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push("Package name must be at least 2 characters");
  }
  
  if (!data.mealCount || data.mealCount < 1 || data.mealCount > 100) {
    errors.push("Meal count must be between 1 and 100");
  }
  
  if (!data.pricePerMeal || data.pricePerMeal < 0.01 || data.pricePerMeal > 999.99) {
    errors.push("Price per meal must be between €0.01 and €999.99");
  }
  
  if (!data.discountPercentage || data.discountPercentage < 1 || data.discountPercentage > 70) {
    errors.push("Discount percentage must be between 1% and 70%");
  }
  
  if (data.validityMonths && (data.validityMonths < 1 || data.validityMonths > 36)) {
    errors.push("Validity must be between 1 and 36 months");
  }
  
  return errors;
};

// Admin authentication middleware - verifies session in database
const adminAuth = async (req: AdminAuthRequest, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const token = authHeader.substring(7);
    
    if (!token || token.length < 10) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Verify session exists in database and is not expired
    const session = await db
      .select()
      .from(adminSessions)
      .where(eq(adminSessions.sessionToken, token))
      .limit(1);
    
    if (session.length === 0) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    const adminSession = session[0];
    
    // Check if session is expired (24 hour expiry)
    const sessionAge = Date.now() - new Date(adminSession.createdAt!).getTime();
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxSessionAge) {
      // Delete expired session
      await db.delete(adminSessions).where(eq(adminSessions.id, adminSession.id));
      return res.status(401).json({ message: "Session expired, please login again" });
    }

    // Fetch admin details
    const admin = await db
      .select()
      .from(eatoffAdmins)
      .where(eq(eatoffAdmins.id, adminSession.adminId))
      .limit(1);
    
    if (admin.length === 0 || !admin[0].isActive) {
      return res.status(401).json({ message: "Admin account inactive or not found" });
    }

    req.adminId = admin[0].id;
    req.admin = admin[0];
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

// Log admin actions for audit trail
const logAdminAction = async (
  adminId: number,
  action: string,
  resourceType?: string,
  resourceId?: string,
  oldValues?: any,
  newValues?: any,
  req?: Request
) => {
  try {
    await db.insert(auditLogs).values({
      adminId,
      action,
      resourceType: resourceType || null,
      resourceId: resourceId || null,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress: req?.ip || null,
      userAgent: req?.get('User-Agent') || null,
    });
  } catch (error) {
    console.error("Failed to log admin action:", error);
  }
};

export function registerAdminRoutes(app: Express) {

  // Admin login with 2FA simulation (MemStorage version)
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { email, password, twoFactorCode } = req.body;

      console.log('Admin login attempt:', { email, password: password?.length, twoFactorCode });

      // Find admin user
      const admin = await storage.getAdminUserByEmail(email);
      console.log('Found admin:', admin ? { id: admin.id, email: admin.email, isActive: admin.isActive } : 'not found');

      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, admin.passwordHash);
      console.log('Password valid:', passwordValid);
      if (!passwordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // For default admin, accept "123456" as fixed 2FA code
      if (email === 'admin@eatoff.com') {
        if (twoFactorCode && twoFactorCode !== '123456') {
          return res.status(401).json({ message: "Invalid 2FA code" });
        }
        // Allow login without 2FA or with correct code for default admin
      } else {
        // For other admins, require any 6-digit 2FA code
        if (!twoFactorCode || twoFactorCode.length !== 6) {
          return res.status(400).json({ message: "2FA code required" });
        }
      }

      // Create session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // Save session in database for proper validation (24 hour expiry)
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db.insert(adminSessions).values({
        adminId: admin.id,
        sessionToken: sessionToken,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
        expiresAt: expiresAt,
      });

      res.json({
        token: sessionToken,
        admin: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions,
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await db
          .update(adminSessions)
          .set({ isActive: false })
          .where(eq(adminSessions.sessionToken, token));
      }

      await logAdminAction(req.adminId!, "admin_logout", "admin", req.adminId!.toString(), undefined, undefined, req);
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Admin logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // Get dashboard metrics
  app.get("/api/admin/dashboard", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      // Get restaurant metrics
      const [restaurantCount] = await db
        .select({
          count: sql<number>`COUNT(*)`,
          active: sql<number>`COUNT(CASE WHEN ${restaurants.isActive} = true THEN 1 END)`,
          approved: sql<number>`COUNT(CASE WHEN ${restaurants.isApproved} = true THEN 1 END)`,
          pending: sql<number>`COUNT(CASE WHEN ${restaurants.isApproved} = false THEN 1 END)`,
        })
        .from(restaurants);

      // Get user metrics
      const [userMetrics] = await db
        .select({
          totalUsers: sql<number>`COUNT(*)`,
        })
        .from(customers);
      
      // Get users created this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const [newUsersThisMonth] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(customers)
        .where(gte(customers.createdAt, startOfMonth));
      
      // Get transaction stats
      const [transactionStats] = await db
        .select({
          totalTransactions: sql<number>`COUNT(*)`,
          totalAmount: sql<number>`COALESCE(SUM(CASE WHEN ${walletTransactions.transactionType} = 'deposit' THEN ${walletTransactions.amount}::numeric ELSE 0 END), 0)`,
        })
        .from(walletTransactions);
      
      // Get this week's transactions
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const [weeklyStats] = await db
        .select({
          count: sql<number>`COUNT(*)`,
          amount: sql<number>`COALESCE(SUM(${walletTransactions.amount}::numeric), 0)`,
        })
        .from(walletTransactions)
        .where(gte(walletTransactions.createdAt, startOfWeek));
      
      // Get today's transactions
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const [dailyStats] = await db
        .select({
          count: sql<number>`COUNT(*)`,
          amount: sql<number>`COALESCE(SUM(${walletTransactions.amount}::numeric), 0)`,
        })
        .from(walletTransactions)
        .where(gte(walletTransactions.createdAt, startOfDay));

      await logAdminAction(req.adminId!, "view_dashboard", "dashboard", undefined, undefined, undefined, req);

      // Return in format expected by frontend
      res.json({
        totalUsers: Number(userMetrics?.totalUsers) || 0,
        totalRestaurants: Number(restaurantCount?.count) || 0,
        totalRevenue: Number(transactionStats?.totalAmount) || 0,
        totalCommission: Number(transactionStats?.totalAmount) * 0.05 || 0, // 5% commission estimate
        activeUsers: Number(newUsersThisMonth?.count) || 0,
        activeRestaurants: Number(restaurantCount?.active) || 0,
        pendingRestaurants: Number(restaurantCount?.pending) || 0,
        approvedRestaurants: Number(restaurantCount?.approved) || 0,
        transactionStats: {
          total: Number(transactionStats?.totalTransactions) || 0,
          totalAmount: Number(transactionStats?.totalAmount) || 0,
          weeklyCount: Number(weeklyStats?.count) || 0,
          weeklyAmount: Number(weeklyStats?.amount) || 0,
          dailyCount: Number(dailyStats?.count) || 0,
          dailyAmount: Number(dailyStats?.amount) || 0,
        }
      });
    } catch (error) {
      console.error("Dashboard metrics error:", error);
      res.status(500).json({ message: "Failed to load dashboard" });
    }
  });

  // Get all restaurants for management
  app.get("/api/admin/restaurants", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const allRestaurants = await db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          cuisine: restaurants.cuisine,
          mainProduct: restaurants.mainProduct,
          dietCategory: restaurants.dietCategory,
          conceptType: restaurants.conceptType,
          experienceType: restaurants.experienceType,
          location: restaurants.location,
          rating: restaurants.rating,
          isActive: restaurants.isActive,
          isApproved: restaurants.isApproved,
          email: restaurants.email,
          restaurantCode: restaurants.restaurantCode,
          approvedAt: restaurants.approvedAt,
          createdAt: restaurants.createdAt,
          marketplaceId: restaurants.marketplaceId,
        })
        .from(restaurants)
        .orderBy(
          desc(restaurants.isApproved),  // Approved restaurants first
          desc(restaurants.approvedAt),  // Then by approval time (most recent first)
          desc(restaurants.id)           // Fallback to ID for consistent ordering
        );

      await logAdminAction(req.adminId!, "view_restaurants", "restaurant", undefined, undefined, undefined, req);

      res.json(allRestaurants);
    } catch (error) {
      console.error("Get restaurants error:", error);
      res.status(500).json({ message: "Failed to load restaurants" });
    }
  });

  // Get all users for management
  app.get("/api/admin/users", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string || "1");
      const limit = parseInt(req.query.limit as string || "50");
      const offset = (page - 1) * limit;

      const users = await db
        .select({
          id: customers.id,
          email: customers.email,
          name: customers.name,
          joinedDate: customers.createdAt,
        })
        .from(customers)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(customers);

      await logAdminAction(req.adminId!, "view_users", "customer", undefined, undefined, undefined, req);

      res.json({
        users,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        }
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to load users" });
    }
  });

  // Approve restaurant
  app.put("/api/admin/restaurants/:id/approve", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const [oldRestaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, parseInt(id)));

      if (!oldRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      await db
        .update(restaurants)
        .set({ 
          isApproved: true,
          isActive: true,
          approvedAt: new Date()
        })
        .where(eq(restaurants.id, parseInt(id)));

      await logAdminAction(
        req.adminId!,
        "approve_restaurant",
        "restaurant",
        id,
        { isApproved: oldRestaurant.isApproved, isActive: oldRestaurant.isActive },
        { isApproved: true, isActive: true },
        req
      );

      res.json({ message: "Restaurant approved successfully" });
    } catch (error) {
      console.error("Approve restaurant error:", error);
      res.status(500).json({ message: "Failed to approve restaurant" });
    }
  });

  // Suspend restaurant
  app.put("/api/admin/restaurants/:id/suspend", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const [oldRestaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, parseInt(id)));

      if (!oldRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      await db
        .update(restaurants)
        .set({ isActive: false })
        .where(eq(restaurants.id, parseInt(id)));

      await logAdminAction(
        req.adminId!,
        "suspend_restaurant",
        "restaurant",
        id,
        { isActive: oldRestaurant.isActive },
        { isActive: false },
        req
      );

      res.json({ message: "Restaurant suspended successfully" });
    } catch (error) {
      console.error("Suspend restaurant error:", error);
      res.status(500).json({ message: "Failed to suspend restaurant" });
    }
  });

  // Update restaurant details (location, address, phone)
  app.put("/api/admin/restaurants/:id/update-details", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { location, address, phone, marketplaceId, ownerCompanyName, ownerTaxId, ownerBusinessRegistration, ownerEmail, ownerPhone, ownerContactPerson, cuisine, mainProduct, dietCategory, conceptType, experienceType } = req.body;

      const [oldRestaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, parseInt(id)));

      if (!oldRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const updateData: any = {};
      if (location && typeof location === 'string' && location.trim()) updateData.location = location.trim();
      if (address && typeof address === 'string') updateData.address = address.trim();
      if (phone && typeof phone === 'string') updateData.phone = phone.trim();
      if (marketplaceId !== undefined) {
        if (marketplaceId === null || marketplaceId === '') {
          updateData.marketplaceId = null;
        } else {
          const parsedMpId = parseInt(marketplaceId);
          if (!isNaN(parsedMpId)) {
            updateData.marketplaceId = parsedMpId;
          }
        }
      }
      if (cuisine !== undefined) updateData.cuisine = cuisine?.trim() || null;
      if (mainProduct !== undefined) updateData.mainProduct = mainProduct?.trim() || null;
      if (dietCategory !== undefined) updateData.dietCategory = dietCategory?.trim() || null;
      if (conceptType !== undefined) updateData.conceptType = conceptType?.trim() || null;
      if (experienceType !== undefined) updateData.experienceType = experienceType?.trim() || null;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(restaurants)
          .set(updateData)
          .where(eq(restaurants.id, parseInt(id)));
      }

      // Update owner info if provided
      if (oldRestaurant.ownerId && (ownerCompanyName || ownerTaxId || ownerBusinessRegistration || ownerEmail || ownerPhone || ownerContactPerson)) {
        const ownerUpdateData: any = {};
        if (ownerCompanyName && typeof ownerCompanyName === 'string') ownerUpdateData.companyName = ownerCompanyName.trim();
        if (ownerTaxId !== undefined) ownerUpdateData.taxId = ownerTaxId?.trim() || null;
        if (ownerBusinessRegistration !== undefined) ownerUpdateData.businessRegistrationNumber = ownerBusinessRegistration?.trim() || null;
        if (ownerEmail && typeof ownerEmail === 'string') ownerUpdateData.email = ownerEmail.trim();
        if (ownerPhone !== undefined) ownerUpdateData.companyPhone = ownerPhone?.trim() || null;
        if (ownerContactPerson !== undefined) ownerUpdateData.contactPersonName = ownerContactPerson?.trim() || null;

        if (Object.keys(ownerUpdateData).length > 0) {
          await db
            .update(restaurantOwners)
            .set(ownerUpdateData)
            .where(eq(restaurantOwners.id, oldRestaurant.ownerId));
        }
      }

      await logAdminAction(
        req.adminId!,
        "update_restaurant_details",
        "restaurant",
        id,
        { location: oldRestaurant.location, address: oldRestaurant.address, phone: oldRestaurant.phone, marketplaceId: oldRestaurant.marketplaceId },
        { ...updateData, ownerCompanyName, ownerTaxId, ownerBusinessRegistration, ownerEmail, ownerPhone, ownerContactPerson },
        req
      );

      res.json({ message: "Restaurant details updated successfully" });
    } catch (error) {
      console.error("Update restaurant details error:", error);
      res.status(500).json({ message: "Failed to update restaurant details" });
    }
  });

  // Update restaurant status
  app.patch("/api/admin/restaurants/:id/status", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const [oldRestaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, parseInt(id)));

      if (!oldRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      await db
        .update(restaurants)
        .set({ isActive })
        .where(eq(restaurants.id, parseInt(id)));

      await logAdminAction(
        req.adminId!,
        "update_restaurant_status",
        "restaurant",
        id,
        { isActive: oldRestaurant.isActive },
        { isActive },
        req
      );

      res.json({ message: "Restaurant status updated successfully" });
    } catch (error) {
      console.error("Update restaurant status error:", error);
      res.status(500).json({ message: "Failed to update restaurant status" });
    }
  });

  // Enroll new restaurant with owner account
  app.post("/api/admin/restaurants/enroll", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const {
        name,
        cuisine,
        mainProduct,
        dietCategory,
        conceptType,
        experienceType,
        location,
        address,
        phone,
        email,
        description,
        priceRange,
        imageUrl,
        marketplaceId,
        companyName,
        companyAddress,
        taxId,
        registrationNumber,
        bankName,
        iban,
        accountHolder,
        ownerEmail,
        ownerPassword,
        contactPerson
      } = req.body;

      // Check if restaurant email already exists
      const [existingRestaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.email, email));

      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant with this email already exists" });
      }

      // Check if owner email already exists
      const { restaurantOwners } = await import("@shared/schema");
      const [existingOwner] = await db
        .select()
        .from(restaurantOwners)
        .where(eq(restaurantOwners.email, ownerEmail));

      if (existingOwner) {
        return res.status(400).json({ message: "Owner account with this email already exists" });
      }

      // Generate unique restaurant code
      const existingCodes = await db
        .select({ restaurantCode: restaurants.restaurantCode })
        .from(restaurants)
        .where(sql`${restaurants.restaurantCode} IS NOT NULL`);

      const existingNumbers = existingCodes
        .map(r => r.restaurantCode)
        .filter(code => code && code.startsWith('EAT'))
        .map(code => parseInt(code!.substring(3)))
        .filter(num => !isNaN(num));

      const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
      const restaurantCode = `EAT${nextNumber.toString().padStart(3, '0')}`;

      // Hash the owner password
      const hashedPassword = await bcrypt.hash(ownerPassword, 10);

      // Create restaurant
      const [newRestaurant] = await db
        .insert(restaurants)
        .values({
          name,
          cuisine,
          mainProduct: mainProduct || null,
          dietCategory: dietCategory || null,
          conceptType: conceptType || null,
          experienceType: experienceType || null,
          location,
          address,
          phone,
          email,
          description,
          priceRange,
          imageUrl: imageUrl || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop&fm=webp&q=80`,
          restaurantCode,
          marketplaceId: marketplaceId || null, // Marketplace for this restaurant
          isApproved: true, // Admin-enrolled restaurants are auto-approved
          isActive: true,
          approvedAt: new Date(),
          rating: "4.5", // Default rating for new restaurants
        })
        .returning();

      // Create owner account with company and banking details
      const [newOwner] = await db
        .insert(restaurantOwners)
        .values({
          email: ownerEmail,
          passwordHash: hashedPassword,
          companyName: companyName || name,
          businessRegistrationNumber: registrationNumber,
          taxId,
          companyAddress: companyAddress || address,
          companyPhone: phone,
          contactPersonName: contactPerson,
          contactPersonTitle: "Owner",
          contactPersonPhone: phone,
          contactPersonEmail: ownerEmail,
          bankName,
          iban,
          bankAccountHolderName: accountHolder,
          isActive: true,
        })
        .returning();

      // Update restaurant with owner reference
      await db
        .update(restaurants)
        .set({ ownerId: newOwner.id })
        .where(eq(restaurants.id, newRestaurant.id));

      await logAdminAction(
        req.adminId!,
        "enroll_restaurant",
        "restaurant",
        newRestaurant.id.toString(),
        undefined,
        {
          restaurantName: name,
          ownerEmail,
          restaurantCode
        },
        req
      );

      res.json({
        message: "Restaurant enrolled successfully",
        restaurant: newRestaurant,
        restaurantCode
      });
    } catch (error) {
      console.error("Restaurant enrollment error:", error);
      res.status(500).json({ message: "Failed to enroll restaurant" });
    }
  });

  // Partner Management Endpoints

  // Get all partners with statistics
  app.get("/api/admin/partners", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const partners = await db
        .select({
          id: restaurantOwners.id,
          companyName: restaurantOwners.companyName,
          vatCode: restaurantOwners.taxId,
          companyAddress: restaurantOwners.companyAddress,
          companyPhone: restaurantOwners.companyPhone,
          companyEmail: restaurantOwners.contactPersonEmail,
          companyWebsite: restaurantOwners.companyWebsite,
          contactPersonName: restaurantOwners.contactPersonName,
          contactPersonTitle: restaurantOwners.contactPersonTitle,
          contactPersonPhone: restaurantOwners.contactPersonPhone,
          contactPersonEmail: restaurantOwners.contactPersonEmail,
          businessRegistrationNumber: restaurantOwners.businessRegistrationNumber,
          bankName: restaurantOwners.bankName,
          iban: restaurantOwners.iban,
          accountHolder: restaurantOwners.bankAccountHolderName,
          isVerified: restaurantOwners.isVerified,
          isActive: restaurantOwners.isActive,
          createdAt: restaurantOwners.createdAt,
          updatedAt: restaurantOwners.updatedAt
        })
        .from(restaurantOwners)
        .orderBy(desc(restaurantOwners.createdAt));

      // Get restaurant count and revenue for each partner
      const partnersWithStats = await Promise.all(
        partners.map(async (partner) => {
          const restaurantCount = await db
            .select({ count: sql<number>`count(*)` })
            .from(restaurants)
            .where(eq(restaurants.ownerId, partner.id));

          return {
            ...partner,
            restaurantCount: restaurantCount[0]?.count || 0,
            totalRevenue: 0 // Will be calculated when order system is implemented
          };
        })
      );

      await logAdminAction(req.adminId!, "view_partners", "partner", undefined, undefined, undefined, req);

      res.json(partnersWithStats);
    } catch (error) {
      console.error("Get partners error:", error);
      res.status(500).json({ message: "Failed to load partners" });
    }
  });

  // Create new partner
  app.post("/api/admin/partners", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const {
        companyName,
        vatCode,
        companyAddress,
        companyPhone,
        companyEmail,
        companyWebsite,
        contactPersonName,
        contactPersonTitle,
        contactPersonPhone,
        contactPersonEmail,
        businessRegistrationNumber,
        bankName,
        iban,
        accountHolder
      } = req.body;

      // Check if VAT code already exists
      const existingPartner = await db
        .select()
        .from(restaurantOwners)
        .where(eq(restaurantOwners.taxId, vatCode));

      if (existingPartner.length > 0) {
        return res.status(400).json({ message: "Partner with this VAT code already exists" });
      }

      // Check if email already exists
      const existingEmail = await db
        .select()
        .from(restaurantOwners)
        .where(eq(restaurantOwners.contactPersonEmail, contactPersonEmail));

      if (existingEmail.length > 0) {
        return res.status(400).json({ message: "Partner with this email already exists" });
      }

      // Generate temporary password for new partner
      const tempPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      const [newPartner] = await db
        .insert(restaurantOwners)
        .values({
          email: contactPersonEmail,
          passwordHash: hashedPassword,
          companyName,
          taxId: vatCode,
          companyAddress,
          companyPhone,
          companyWebsite,
          contactPersonName,
          contactPersonTitle,
          contactPersonPhone,
          contactPersonEmail,
          businessRegistrationNumber,
          bankName,
          iban,
          bankAccountHolderName: accountHolder,
          isActive: true,
          isVerified: false
        })
        .returning();

      await logAdminAction(
        req.adminId!,
        "create_partner",
        "partner",
        newPartner.id.toString(),
        undefined,
        {
          companyName,
          vatCode,
          contactPersonEmail
        },
        req
      );

      res.json({
        message: "Partner created successfully",
        partner: newPartner,
        tempPassword // In production, this should be sent via secure email
      });
    } catch (error) {
      console.error("Create partner error:", error);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  // Update partner information
  app.put("/api/admin/partners/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const partnerId = parseInt(req.params.id);
      const {
        companyName,
        vatCode,
        companyAddress,
        companyPhone,
        companyEmail,
        companyWebsite,
        contactPersonName,
        contactPersonTitle,
        contactPersonPhone,
        contactPersonEmail,
        businessRegistrationNumber,
        bankName,
        iban,
        accountHolder
      } = req.body;

      // Update partner in database
      await db
        .update(restaurantOwners)
        .set({
          companyName,
          taxId: vatCode,
          companyAddress,
          companyPhone,
          contactPersonEmail: companyEmail,
          companyWebsite,
          contactPersonName,
          contactPersonTitle,
          contactPersonPhone,
          businessRegistrationNumber,
          bankName,
          iban,
          bankAccountHolderName: accountHolder,
          updatedAt: new Date()
        })
        .where(eq(restaurantOwners.id, partnerId));

      await logAdminAction(req.adminId!, "update_partner", "partner", partnerId.toString(), { companyName, vatCode }, undefined, req);

      res.json({ message: "Partner updated successfully" });
    } catch (error) {
      console.error("Update partner error:", error);
      res.status(500).json({ message: "Failed to update partner" });
    }
  });

  // Update partner status (activate/suspend)
  app.put("/api/admin/partners/:id/status", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const [oldPartner] = await db
        .select()
        .from(restaurantOwners)
        .where(eq(restaurantOwners.id, parseInt(id)));

      if (!oldPartner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      await db
        .update(restaurantOwners)
        .set({ isActive })
        .where(eq(restaurantOwners.id, parseInt(id)));

      await logAdminAction(
        req.adminId!,
        "update_partner_status",
        "partner",
        id,
        { isActive: oldPartner.isActive },
        { isActive },
        req
      );

      res.json({ message: "Partner status updated successfully" });
    } catch (error) {
      console.error("Update partner status error:", error);
      res.status(500).json({ message: "Failed to update partner status" });
    }
  });

  // Restaurant Management Endpoints

  // Get restaurant details with menu items and voucher packages
  app.get("/api/admin/restaurants/:id/details", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);

      // Get restaurant details with owner and marketplace info
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId));

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Get owner/company details
      const [owner] = await db
        .select()
        .from(restaurantOwners)
        .where(eq(restaurantOwners.id, restaurant.ownerId));

      // Get marketplace details
      let marketplace = null;
      if (restaurant.marketplaceId) {
        const [mp] = await db
          .select()
          .from(marketplaces)
          .where(eq(marketplaces.id, restaurant.marketplaceId));
        marketplace = mp;
      }

      // Get menu items
      const menuItemsList = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId))
        .orderBy(menuItems.category, menuItems.name);

      // Get voucher packages
      const voucherPackagesList = await db
        .select()
        .from(voucherPackages)
        .where(eq(voucherPackages.restaurantId, restaurantId))
        .orderBy(desc(voucherPackages.id));

      await logAdminAction(req.adminId!, "view_restaurant_details", "restaurant", restaurantId.toString(), undefined, undefined, req);

      res.json({
        restaurant,
        owner: owner ? {
          id: owner.id,
          email: owner.email,
          companyName: owner.companyName,
          businessRegistrationNumber: owner.businessRegistrationNumber,
          taxId: owner.taxId,
          companyAddress: owner.companyAddress,
          companyPhone: owner.companyPhone,
          companyWebsite: owner.companyWebsite,
          contactPersonName: owner.contactPersonName,
          contactPersonTitle: owner.contactPersonTitle,
          contactPersonPhone: owner.contactPersonPhone,
          contactPersonEmail: owner.contactPersonEmail,
          bankName: owner.bankName,
          iban: owner.iban,
          isVerified: owner.isVerified,
        } : null,
        marketplace,
        menuItems: menuItemsList,
        voucherPackages: voucherPackagesList
      });
    } catch (error) {
      console.error("Get restaurant details error:", error);
      res.status(500).json({ message: "Failed to load restaurant details" });
    }
  });

  // Get menu items for a restaurant
  app.get("/api/admin/restaurants/:id/menu", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);

      const menuItemsList = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId))
        .orderBy(menuItems.category, menuItems.name);

      res.json(menuItemsList);
    } catch (error) {
      console.error("Get menu items error:", error);
      res.status(500).json({ message: "Failed to load menu items" });
    }
  });

  // Create new menu item
  app.post("/api/admin/restaurants/:id/menu", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const {
        name,
        description,
        category,
        price,
        imageUrl,
        ingredients,
        allergens,
        dietaryTags,
        spiceLevel,
        calories,
        preparationTime,
        isPopular,
        isAvailable
      } = req.body;

      const [newMenuItem] = await db
        .insert(menuItems)
        .values({
          restaurantId,
          name,
          description,
          category,
          price,
          imageUrl,
          ingredients: ingredients || [],
          allergens: allergens || [],
          dietaryTags: dietaryTags || [],
          spiceLevel: spiceLevel || 0,
          calories,
          preparationTime,
          isPopular: isPopular || false,
          isAvailable: isAvailable !== false
        })
        .returning();

      await logAdminAction(req.adminId!, "create_menu_item", "menu_item", newMenuItem.id.toString(), undefined, { name, restaurantId }, req);

      res.json(newMenuItem);
    } catch (error) {
      console.error("Create menu item error:", error);
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });

  // Update menu item
  app.put("/api/admin/menu-items/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const menuItemId = parseInt(req.params.id);
      const {
        name,
        description,
        category,
        price,
        imageUrl,
        ingredients,
        allergens,
        dietaryTags,
        spiceLevel,
        calories,
        preparationTime,
        isPopular,
        isAvailable
      } = req.body;

      const [oldMenuItem] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, menuItemId));

      if (!oldMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      const [updatedMenuItem] = await db
        .update(menuItems)
        .set({
          name,
          description,
          category,
          price,
          imageUrl,
          ingredients: ingredients || [],
          allergens: allergens || [],
          dietaryTags: dietaryTags || [],
          spiceLevel: spiceLevel || 0,
          calories,
          preparationTime,
          isPopular: isPopular || false,
          isAvailable: isAvailable !== false
        })
        .where(eq(menuItems.id, menuItemId))
        .returning();

      await logAdminAction(req.adminId!, "update_menu_item", "menu_item", menuItemId.toString(), { name: oldMenuItem.name }, { name }, req);

      res.json(updatedMenuItem);
    } catch (error) {
      console.error("Update menu item error:", error);
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  // Delete menu item
  app.delete("/api/admin/menu-items/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const menuItemId = parseInt(req.params.id);

      const [oldMenuItem] = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, menuItemId));

      if (!oldMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      await db
        .delete(menuItems)
        .where(eq(menuItems.id, menuItemId));

      await logAdminAction(req.adminId!, "delete_menu_item", "menu_item", menuItemId.toString(), { name: oldMenuItem.name }, undefined, req);

      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      console.error("Delete menu item error:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Get voucher packages for a restaurant
  app.get("/api/admin/restaurants/:id/vouchers", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);

      const voucherPackagesList = await db
        .select()
        .from(voucherPackages)
        .where(eq(voucherPackages.restaurantId, restaurantId))
        .orderBy(desc(voucherPackages.id));

      res.json(voucherPackagesList);
    } catch (error) {
      console.error("Get voucher packages error:", error);
      res.status(500).json({ message: "Failed to load voucher packages" });
    }
  });

  // Create new voucher package
  app.post("/api/admin/restaurants/:id/vouchers", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const {
        name,
        description,
        mealCount,
        pricePerMeal,
        discountPercentage,
        validityMonths,
        validityType,
        validityStartDate,
        validityEndDate,
        imageUrl,
        isActive
      } = req.body;

      // Validate input data
      const validationErrors = validateVoucherPackage(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationErrors 
        });
      }

      // Verify restaurant exists
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId));

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Prepare validity data based on type
      let voucherData: any = {
        restaurantId,
        name: name.trim(),
        description: description?.trim() || null,
        mealCount: Math.floor(mealCount),
        pricePerMeal: Math.round(pricePerMeal * 100) / 100,
        discountPercentage: Math.round(discountPercentage * 100) / 100,
        validityType: validityType || "months",
        imageUrl: imageUrl?.trim() || null,
        isActive: isActive === true
      };

      if (validityType === "custom_dates") {
        voucherData.validityStartDate = validityStartDate ? new Date(validityStartDate) : null;
        voucherData.validityEndDate = validityEndDate ? new Date(validityEndDate) : null;
        voucherData.validityMonths = null; // Clear months when using custom dates
      } else {
        voucherData.validityMonths = validityMonths || 12;
        voucherData.validityStartDate = null;
        voucherData.validityEndDate = null;
      }

      const [newVoucherPackage] = await db
        .insert(voucherPackages)
        .values(voucherData)
        .returning();

      await logAdminAction(req.adminId!, "create_voucher_package", "voucher_package", newVoucherPackage.id.toString(), undefined, { name, restaurantId }, req);

      res.json(newVoucherPackage);
    } catch (error) {
      console.error("Create voucher package error:", error);
      res.status(500).json({ message: "Failed to create voucher package" });
    }
  });

  // Update voucher package
  app.put("/api/admin/voucher-packages/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const voucherPackageId = parseInt(req.params.id);
      const {
        name,
        description,
        mealCount,
        pricePerMeal,
        discountPercentage,
        validityMonths,
        validityType,
        validityStartDate,
        validityEndDate,
        imageUrl,
        isActive
      } = req.body;

      // Validate input data
      const validationErrors = validateVoucherPackage(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationErrors 
        });
      }

      const [oldVoucherPackage] = await db
        .select()
        .from(voucherPackages)
        .where(eq(voucherPackages.id, voucherPackageId));

      if (!oldVoucherPackage) {
        return res.status(404).json({ message: "Voucher package not found" });
      }

      // Prepare update data based on validity type
      let updateData: any = {
        name: name.trim(),
        description: description?.trim() || null,
        mealCount: Math.floor(mealCount),
        pricePerMeal: Math.round(pricePerMeal * 100) / 100,
        discountPercentage: Math.round(discountPercentage * 100) / 100,
        validityType: validityType || "months",
        imageUrl: imageUrl?.trim() || null,
        isActive: isActive === true
      };

      if (validityType === "custom_dates") {
        updateData.validityStartDate = validityStartDate ? new Date(validityStartDate) : null;
        updateData.validityEndDate = validityEndDate ? new Date(validityEndDate) : null;
        updateData.validityMonths = null; // Clear months when using custom dates
      } else {
        updateData.validityMonths = validityMonths || 12;
        updateData.validityStartDate = null;
        updateData.validityEndDate = null;
      }

      const [updatedVoucherPackage] = await db
        .update(voucherPackages)
        .set(updateData)
        .where(eq(voucherPackages.id, voucherPackageId))
        .returning();

      await logAdminAction(req.adminId!, "update_voucher_package", "voucher_package", voucherPackageId.toString(), { name: oldVoucherPackage.name }, { name }, req);

      res.json(updatedVoucherPackage);
    } catch (error) {
      console.error("Update voucher package error:", error);
      res.status(500).json({ message: "Failed to update voucher package" });
    }
  });

  // Delete voucher package
  app.delete("/api/admin/voucher-packages/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const voucherPackageId = parseInt(req.params.id);

      const [oldVoucherPackage] = await db
        .select()
        .from(voucherPackages)
        .where(eq(voucherPackages.id, voucherPackageId));

      if (!oldVoucherPackage) {
        return res.status(404).json({ message: "Voucher package not found" });
      }

      await db
        .delete(voucherPackages)
        .where(eq(voucherPackages.id, voucherPackageId));

      await logAdminAction(req.adminId!, "delete_voucher_package", "voucher_package", voucherPackageId.toString(), { name: oldVoucherPackage.name }, undefined, req);

      res.json({ message: "Voucher package deleted successfully" });
    } catch (error) {
      console.error("Delete voucher package error:", error);
      res.status(500).json({ message: "Failed to delete voucher package" });
    }
  });

  // EatOff Voucher Management Routes
  // Get all EatOff vouchers
  app.get("/api/admin/eatoff-vouchers", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const vouchers = await storage.getEatoffVouchers();
      res.json(vouchers);
    } catch (error) {
      console.error('Error fetching EatOff vouchers:', error);
      res.status(500).json({ error: 'Failed to fetch EatOff vouchers' });
    }
  });

  // Create new EatOff voucher
  app.post("/api/admin/eatoff-vouchers", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { 
        name, 
        description, 
        discount, 
        validMonths, 
        isActive, 
        totalValue, 
        imageUrl, 
        mealCount, 
        pricePerMeal,
        voucherType,
        bonusPercentage,
        paymentTermDays,
        requiresPreauth 
      } = req.body;
      
      const voucherData = {
        name,
        description,
        discountPercentage: discount.toString(),
        validityMonths: validMonths,
        validityStartDate: new Date(),
        validityEndDate: new Date(Date.now() + (validMonths * 30 * 24 * 60 * 60 * 1000)), // validMonths from now
        validityType: 'months',
        isActive: isActive ?? false,
        totalValue: totalValue.toString(),
        imageUrl: imageUrl || null,
        mealCount: mealCount || null,
        pricePerMeal: pricePerMeal ? pricePerMeal.toString() : null,
        // Pay Later fields
        voucherType: voucherType || 'immediate',
        bonusPercentage: bonusPercentage ? bonusPercentage.toString() : '0.00',
        paymentTermDays: paymentTermDays || 30,
        requiresPreauth: requiresPreauth ?? true,
        brandColor: '#FF6B35'
      };

      const newVoucher = await storage.createEatoffVoucher(voucherData);
      
      // Skip audit logging for MemStorage testing
      // await logAdminAction(req.adminId!, "create_eatoff_voucher", "eatoff_voucher", newVoucher.id.toString(), undefined, { name, discount, isActive }, req);
      
      res.status(201).json(newVoucher);
    } catch (error) {
      console.error('Error creating EatOff voucher:', error);
      res.status(500).json({ error: 'Failed to create EatOff voucher' });
    }
  });

  // Update EatOff voucher
  app.put("/api/admin/eatoff-vouchers/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const voucherId = parseInt(req.params.id);
      const { 
        name, 
        description, 
        discount, 
        validMonths, 
        isActive, 
        totalValue, 
        imageUrl, 
        mealCount, 
        pricePerMeal,
        voucherType,
        bonusPercentage,
        paymentTermDays,
        requiresPreauth 
      } = req.body;
      
      const oldVoucher = await storage.getEatoffVoucherById(voucherId);
      if (!oldVoucher) {
        return res.status(404).json({ error: 'EatOff voucher not found' });
      }
      
      const updateData = {
        name,
        description,
        discountPercentage: discount.toString(),
        validityMonths: validMonths,
        isActive,
        totalValue: totalValue.toString(),
        imageUrl: imageUrl || null,
        mealCount: mealCount || null,
        pricePerMeal: pricePerMeal ? pricePerMeal.toString() : null,
        // Pay Later fields
        voucherType: voucherType || oldVoucher.voucherType || 'immediate',
        bonusPercentage: bonusPercentage ? bonusPercentage.toString() : oldVoucher.bonusPercentage || '0.00',
        paymentTermDays: paymentTermDays || oldVoucher.paymentTermDays || 30,
        requiresPreauth: requiresPreauth ?? oldVoucher.requiresPreauth ?? true
      };

      const updatedVoucher = await storage.updateEatoffVoucher(voucherId, updateData);
      
      if (!updatedVoucher) {
        return res.status(404).json({ error: 'EatOff voucher not found' });
      }
      
      // Skip audit logging for MemStorage testing
      // await logAdminAction(req.adminId!, "update_eatoff_voucher", "eatoff_voucher", voucherId.toString(), { name: oldVoucher.name, isActive: oldVoucher.isActive }, { name, isActive }, req);
      
      // For MemStorage, we don't need cache invalidation
      console.log(`EatOff voucher ${voucherId} updated successfully`);
      
      res.json(updatedVoucher);
    } catch (error) {
      console.error('Error updating EatOff voucher:', error);
      res.status(500).json({ error: 'Failed to update EatOff voucher' });
    }
  });

  // Delete EatOff voucher
  app.delete("/api/admin/eatoff-vouchers/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const voucherId = parseInt(req.params.id);
      
      const oldVoucher = await storage.getEatoffVoucherById(voucherId);
      if (!oldVoucher) {
        return res.status(404).json({ error: 'EatOff voucher not found' });
      }
      
      const deleted = await storage.deleteEatoffVoucher(voucherId);
      if (!deleted) {
        return res.status(404).json({ error: 'EatOff voucher not found' });
      }
      
      // Skip audit logging for MemStorage testing
      // await logAdminAction(req.adminId!, "delete_eatoff_voucher", "eatoff_voucher", voucherId.toString(), { name: oldVoucher.name }, undefined, req);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting EatOff voucher:', error);
      res.status(500).json({ error: 'Failed to delete EatOff voucher' });
    }
  });

  // Object storage routes for file uploads
  app.post("/api/admin/objects/upload", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Handle image upload completion and set ACL policy
  app.put("/api/admin/voucher-images", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: "admin",
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting voucher image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ============================================
  // MARKETPLACE MANAGEMENT ROUTES
  // ============================================

  // Get all marketplaces
  app.get("/api/admin/marketplaces", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const allMarketplaces = await db.select().from(marketplaces).orderBy(marketplaces.name);
      res.json(allMarketplaces);
    } catch (error) {
      console.error("Error fetching marketplaces:", error);
      res.status(500).json({ error: "Failed to fetch marketplaces" });
    }
  });

  // Get single marketplace
  app.get("/api/admin/marketplaces/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const [marketplace] = await db.select().from(marketplaces).where(eq(marketplaces.id, id));
      if (!marketplace) {
        return res.status(404).json({ error: "Marketplace not found" });
      }
      res.json(marketplace);
    } catch (error) {
      console.error("Error fetching marketplace:", error);
      res.status(500).json({ error: "Failed to fetch marketplace" });
    }
  });

  // Create marketplace
  app.post("/api/admin/marketplaces", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const parsed = insertMarketplaceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid marketplace data", details: parsed.error.errors });
      }

      // If this is set as default, unset other defaults first
      if (parsed.data.isDefault) {
        await db.update(marketplaces).set({ isDefault: false });
      }

      const [newMarketplace] = await db.insert(marketplaces).values(parsed.data).returning();
      res.status(201).json(newMarketplace);
    } catch (error) {
      console.error("Error creating marketplace:", error);
      res.status(500).json({ error: "Failed to create marketplace" });
    }
  });

  // Update marketplace
  app.patch("/api/admin/marketplaces/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // If setting as default, unset other defaults first
      if (updates.isDefault === true) {
        await db.update(marketplaces).set({ isDefault: false }).where(sql`1=1`);
      }

      const [updated] = await db.update(marketplaces)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(marketplaces.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Marketplace not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating marketplace:", error);
      res.status(500).json({ error: "Failed to update marketplace" });
    }
  });

  // Delete marketplace
  app.delete("/api/admin/marketplaces/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);

      // Check if any restaurants use this marketplace
      const [restaurantUsingMarketplace] = await db.select()
        .from(restaurants)
        .where(eq(restaurants.marketplaceId, id))
        .limit(1);

      if (restaurantUsingMarketplace) {
        return res.status(400).json({ 
          error: "Cannot delete marketplace", 
          message: "This marketplace has restaurants assigned to it. Please reassign them first." 
        });
      }

      const [deleted] = await db.delete(marketplaces).where(eq(marketplaces.id, id)).returning();
      if (!deleted) {
        return res.status(404).json({ error: "Marketplace not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting marketplace:", error);
      res.status(500).json({ error: "Failed to delete marketplace" });
    }
  });

  // Public endpoint to get active marketplaces (for restaurant enrollment)
  app.get("/api/marketplaces", async (req: Request, res: Response) => {
    try {
      const activeMarketplaces = await db.select()
        .from(marketplaces)
        .where(eq(marketplaces.isActive, true))
        .orderBy(marketplaces.name);
      res.json(activeMarketplaces);
    } catch (error) {
      console.error("Error fetching marketplaces:", error);
      res.status(500).json({ error: "Failed to fetch marketplaces" });
    }
  });

  // Public endpoint to get cities from GeoNames database
  app.get("/api/cities", async (req: Request, res: Response) => {
    try {
      const { country, search, limit = "100" } = req.query;
      
      const conditions = [];
      
      // Filter by country code (required for dropdown use)
      if (country && typeof country === 'string') {
        conditions.push(eq(geonamesCities.countryCode, country.toUpperCase()));
      }
      
      // Optional search filter
      if (search && typeof search === 'string' && search.length >= 2) {
        conditions.push(ilike(geonamesCities.name, `${search}%`));
      }

      const query = db.select({
        geonameId: geonamesCities.geonameId,
        name: geonamesCities.name,
        asciiName: geonamesCities.asciiName,
        countryCode: geonamesCities.countryCode,
        admin1Code: geonamesCities.admin1Code,
        population: geonamesCities.population,
        latitude: geonamesCities.latitude,
        longitude: geonamesCities.longitude
      })
        .from(geonamesCities)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(geonamesCities.population))
        .limit(parseInt(limit as string) || 100);

      const cities = await query;
      res.json(cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  // Seed cities endpoint - for syncing cities to production
  // Uses SEED_SECRET for authentication instead of admin token
  app.post("/api/admin/seed-cities", async (req: Request, res: Response) => {
    try {
      const seedSecret = req.headers['x-seed-secret'];
      const expectedSecret = process.env.SEED_SECRET || 'eatoff-seed-2024-secret';
      
      if (seedSecret !== expectedSecret) {
        return res.status(401).json({ error: "Invalid seed secret" });
      }
      
      const { cities } = req.body;
      
      if (!cities || !Array.isArray(cities)) {
        return res.status(400).json({ error: "Cities array required" });
      }
      
      // Check current count - allow up to 200k cities
      const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(geonamesCities);
      
      if (Number(count) > 200000) {
        return res.json({ message: "Cities already seeded", count: Number(count) });
      }
      
      // Insert in batches
      const batchSize = 500;
      let inserted = 0;
      
      for (let i = 0; i < cities.length; i += batchSize) {
        const batch = cities.slice(i, i + batchSize);
        await db.insert(geonamesCities).values(batch).onConflictDoNothing();
        inserted += batch.length;
      }
      
      res.json({ message: "Cities seeded successfully", inserted });
    } catch (error) {
      console.error("Error seeding cities:", error);
      res.status(500).json({ error: "Failed to seed cities" });
    }
  });

  // Get available countries from GeoNames database
  app.get("/api/countries", async (req: Request, res: Response) => {
    try {
      const countries = await db.selectDistinct({ countryCode: geonamesCities.countryCode })
        .from(geonamesCities)
        .orderBy(asc(geonamesCities.countryCode));
      res.json(countries.map(c => c.countryCode));
    } catch (error) {
      console.error("Error fetching countries:", error);
      res.status(500).json({ error: "Failed to fetch countries" });
    }
  });

  // ============================================
  // CHEF MANAGEMENT (Admin Only)
  // ============================================

  app.get("/api/admin/chefs", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { search, restaurantId, featured } = req.query;

      const chefs = await db
        .select({
          chef: chefProfiles,
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
          }
        })
        .from(chefProfiles)
        .leftJoin(restaurants, eq(chefProfiles.restaurantId, restaurants.id))
        .orderBy(desc(chefProfiles.createdAt));

      let filtered = chefs;

      if (search) {
        const searchLower = (search as string).toLowerCase();
        filtered = filtered.filter(c => 
          c.chef.chefName.toLowerCase().includes(searchLower) ||
          c.chef.title?.toLowerCase().includes(searchLower) ||
          c.restaurant?.name?.toLowerCase().includes(searchLower)
        );
      }

      if (restaurantId) {
        const restId = parseInt(restaurantId as string);
        filtered = filtered.filter(c => c.chef.restaurantId === restId);
      }

      if (featured === 'true') {
        filtered = filtered.filter(c => c.chef.isFeatured);
      } else if (featured === 'false') {
        filtered = filtered.filter(c => !c.chef.isFeatured);
      }

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching chefs:", error);
      res.status(500).json({ message: "Failed to fetch chefs" });
    }
  });

  app.get("/api/admin/chefs/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const chefId = parseInt(id);

      const [result] = await db
        .select({
          chef: chefProfiles,
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
          }
        })
        .from(chefProfiles)
        .leftJoin(restaurants, eq(chefProfiles.restaurantId, restaurants.id))
        .where(eq(chefProfiles.id, chefId));

      if (!result) {
        return res.status(404).json({ message: "Chef not found" });
      }

      const signatureDishes = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.signatureChefId, chefId));

      res.json({ ...result, signatureDishes });
    } catch (error) {
      console.error("Error fetching chef:", error);
      res.status(500).json({ message: "Failed to fetch chef" });
    }
  });

  app.post("/api/admin/chefs", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { restaurantId, chefName, title, bio, profileImage, coverImage, specialties, cuisineExpertise, cookingStyles, experienceLevel, yearsOfExperience, certifications, website, instagram, youtube, tiktok, facebook, isPublic, isFeatured } = req.body;

      if (!restaurantId || !chefName) {
        return res.status(400).json({ message: "Restaurant and chef name are required" });
      }

      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const [chef] = await db
        .insert(chefProfiles)
        .values({
          restaurantId,
          chefName,
          title: title || null,
          bio: bio || null,
          profileImage: profileImage || null,
          coverImage: coverImage || null,
          specialties: specialties || [],
          cuisineExpertise: cuisineExpertise || [],
          cookingStyles: cookingStyles || [],
          experienceLevel: experienceLevel || 'professional',
          yearsOfExperience: yearsOfExperience || 0,
          certifications: certifications || [],
          website: website || null,
          instagram: instagram || null,
          youtube: youtube || null,
          tiktok: tiktok || null,
          facebook: facebook || null,
          isPublic: isPublic !== false,
          isFeatured: isFeatured || false,
        })
        .returning();

      await logAdminAction(req.adminId!, 'create_chef', 'chef', String(chef.id), null, chef, req);
      res.status(201).json(chef);
    } catch (error) {
      console.error("Error creating chef:", error);
      res.status(500).json({ message: "Failed to create chef" });
    }
  });

  app.put("/api/admin/chefs/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const chefId = parseInt(id);

      const [existing] = await db.select().from(chefProfiles).where(eq(chefProfiles.id, chefId));
      if (!existing) {
        return res.status(404).json({ message: "Chef not found" });
      }

      const updateData: any = { updatedAt: new Date() };
      const fields = ['restaurantId', 'chefName', 'title', 'bio', 'profileImage', 'coverImage', 'specialties', 'cuisineExpertise', 'cookingStyles', 'experienceLevel', 'yearsOfExperience', 'certifications', 'website', 'instagram', 'youtube', 'tiktok', 'facebook', 'isPublic', 'isFeatured'];

      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      });

      const [updated] = await db
        .update(chefProfiles)
        .set(updateData)
        .where(eq(chefProfiles.id, chefId))
        .returning();

      await logAdminAction(req.adminId!, 'update_chef', 'chef', String(chefId), existing, updated, req);
      res.json(updated);
    } catch (error) {
      console.error("Error updating chef:", error);
      res.status(500).json({ message: "Failed to update chef" });
    }
  });

  app.delete("/api/admin/chefs/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const chefId = parseInt(id);

      const [existing] = await db.select().from(chefProfiles).where(eq(chefProfiles.id, chefId));
      if (!existing) {
        return res.status(404).json({ message: "Chef not found" });
      }

      await db.update(menuItems).set({ signatureChefId: null }).where(eq(menuItems.signatureChefId, chefId));
      await db.delete(chefProfiles).where(eq(chefProfiles.id, chefId));

      await logAdminAction(req.adminId!, 'delete_chef', 'chef', String(chefId), existing, null, req);
      res.json({ message: "Chef deleted successfully" });
    } catch (error) {
      console.error("Error deleting chef:", error);
      res.status(500).json({ message: "Failed to delete chef" });
    }
  });

  app.patch("/api/admin/chefs/:id/featured", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;
      const chefId = parseInt(id);

      const [updated] = await db
        .update(chefProfiles)
        .set({ isFeatured, updatedAt: new Date() })
        .where(eq(chefProfiles.id, chefId))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Chef not found" });
      }

      await logAdminAction(req.adminId!, 'toggle_chef_featured', 'chef', String(chefId), null, { isFeatured }, req);
      res.json(updated);
    } catch (error) {
      console.error("Error updating chef featured status:", error);
      res.status(500).json({ message: "Failed to update chef" });
    }
  });

  app.patch("/api/admin/menu-items/:id/signature-chef", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { signatureChefId } = req.body;
      const menuItemId = parseInt(id);

      const [updated] = await db
        .update(menuItems)
        .set({ signatureChefId: signatureChefId || null })
        .where(eq(menuItems.id, menuItemId))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      await logAdminAction(req.adminId!, 'update_menu_item_signature_chef', 'menu_item', String(menuItemId), null, { signatureChefId }, req);
      res.json(updated);
    } catch (error) {
      console.error("Error updating menu item signature chef:", error);
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });

  // ============================================
  // MOBILE FILTERS MANAGEMENT
  // ============================================

  // Get all mobile filters (admin)
  app.get("/api/admin/mobile-filters", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const filters = await db
        .select()
        .from(mobileFilters)
        .orderBy(asc(mobileFilters.sortOrder));
      res.json(filters);
    } catch (error) {
      console.error("Error fetching mobile filters:", error);
      res.status(500).json({ message: "Failed to fetch mobile filters" });
    }
  });

  // Create mobile filter
  app.post("/api/admin/mobile-filters", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { name, icon, filterType, filterValues, isActive, sortOrder } = req.body;
      
      console.log("[Mobile Filters] Create request:", { name, icon, filterType, filterValues, isActive, sortOrder });
      
      if (!name || !filterType) {
        console.log("[Mobile Filters] Validation failed - missing name or filterType");
        return res.status(400).json({ message: "Name and filterType are required" });
      }
      
      // Ensure filterValues is an array
      const valuesArray = Array.isArray(filterValues) ? filterValues : [];

      const [newFilter] = await db
        .insert(mobileFilters)
        .values({
          name,
          icon: icon || "🏷️",
          filterType,
          filterValues: valuesArray,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder || 0,
        })
        .returning();

      await logAdminAction(req.adminId!, 'create_mobile_filter', 'mobile_filter', String(newFilter.id), null, newFilter, req);
      res.status(201).json(newFilter);
    } catch (error) {
      console.error("Error creating mobile filter:", error);
      res.status(500).json({ message: "Failed to create mobile filter" });
    }
  });

  // Update mobile filter
  app.patch("/api/admin/mobile-filters/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const filterId = parseInt(req.params.id);
      const { name, icon, filterType, filterValues, isActive, sortOrder } = req.body;

      const updateData: any = { updatedAt: new Date() };
      if (name !== undefined) updateData.name = name;
      if (icon !== undefined) updateData.icon = icon;
      if (filterType !== undefined) updateData.filterType = filterType;
      if (filterValues !== undefined) updateData.filterValues = filterValues;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      const [updated] = await db
        .update(mobileFilters)
        .set(updateData)
        .where(eq(mobileFilters.id, filterId))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Mobile filter not found" });
      }

      await logAdminAction(req.adminId!, 'update_mobile_filter', 'mobile_filter', String(filterId), null, updateData, req);
      res.json(updated);
    } catch (error) {
      console.error("Error updating mobile filter:", error);
      res.status(500).json({ message: "Failed to update mobile filter" });
    }
  });

  // Delete mobile filter
  app.delete("/api/admin/mobile-filters/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const filterId = parseInt(req.params.id);

      const [deleted] = await db
        .delete(mobileFilters)
        .where(eq(mobileFilters.id, filterId))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Mobile filter not found" });
      }

      await logAdminAction(req.adminId!, 'delete_mobile_filter', 'mobile_filter', String(filterId), deleted, null, req);
      res.json({ message: "Mobile filter deleted successfully" });
    } catch (error) {
      console.error("Error deleting mobile filter:", error);
      res.status(500).json({ message: "Failed to delete mobile filter" });
    }
  });

  // Get unique filter values from restaurants
  app.get("/api/admin/filter-values", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const allRestaurants = await db
        .select({
          cuisine: restaurants.cuisine,
          mainProduct: restaurants.mainProduct,
          dietCategory: restaurants.dietCategory,
          conceptType: restaurants.conceptType,
          experienceType: restaurants.experienceType,
        })
        .from(restaurants)
        .where(eq(restaurants.isActive, true));

      // Extract unique non-null values for each field
      const uniqueValues = {
        cuisine: Array.from(new Set(allRestaurants.map(r => r.cuisine).filter(Boolean) as string[])).sort(),
        mainProduct: Array.from(new Set(allRestaurants.map(r => r.mainProduct).filter(Boolean) as string[])).sort(),
        dietCategory: Array.from(new Set(allRestaurants.map(r => r.dietCategory).filter(Boolean) as string[])).sort(),
        conceptType: Array.from(new Set(allRestaurants.map(r => r.conceptType).filter(Boolean) as string[])).sort(),
        experienceType: Array.from(new Set(allRestaurants.map(r => r.experienceType).filter(Boolean) as string[])).sort(),
      };

      res.json(uniqueValues);
    } catch (error) {
      console.error("Error fetching filter values:", error);
      res.status(500).json({ message: "Failed to fetch filter values" });
    }
  });

  // Reorder mobile filters
  app.post("/api/admin/mobile-filters/reorder", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { filterIds } = req.body; // Array of filter IDs in new order

      if (!filterIds || !Array.isArray(filterIds)) {
        return res.status(400).json({ message: "filterIds array is required" });
      }

      // Update sort order for each filter
      for (let i = 0; i < filterIds.length; i++) {
        await db
          .update(mobileFilters)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(eq(mobileFilters.id, filterIds[i]));
      }

      await logAdminAction(req.adminId!, 'reorder_mobile_filters', 'mobile_filter', 'bulk', null, { filterIds }, req);
      res.json({ message: "Filters reordered successfully" });
    } catch (error) {
      console.error("Error reordering mobile filters:", error);
      res.status(500).json({ message: "Failed to reorder mobile filters" });
    }
  });

  // ============================================
  // FINANCIAL MANAGEMENT ENDPOINTS
  // ============================================

  // 1. GET /api/admin/restaurants/commissions - List all restaurants with commission settings
  app.get("/api/admin/restaurants/commissions", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantsWithCommissions = await db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          cuisine: restaurants.cuisine,
          restaurantCode: restaurants.restaurantCode,
          commissionRate: restaurants.commissionRate,
          participatesInCashback: restaurants.participatesInCashback,
          customCommissionNote: restaurants.customCommissionNote,
          pendingSettlementAmount: restaurants.pendingSettlementAmount,
          totalSettledAmount: restaurants.totalSettledAmount,
          lastSettlementDate: restaurants.lastSettlementDate,
          bankAccountName: restaurants.bankAccountName,
          bankIban: restaurants.bankIban,
          isActive: restaurants.isActive,
          isApproved: restaurants.isApproved,
        })
        .from(restaurants)
        .where(eq(restaurants.isApproved, true))
        .orderBy(asc(restaurants.name));

      // Transform data to match frontend expected format
      const formattedRestaurants = restaurantsWithCommissions.map(r => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine || 'Unknown',
        commissionRate: parseFloat(r.commissionRate || '5'),
        isCashbackParticipant: r.participatesInCashback || false,
        pendingSettlement: parseFloat(r.pendingSettlementAmount || '0'),
        totalSettled: parseFloat(r.totalSettledAmount || '0'),
      }));

      // Calculate totals for metrics cards
      const activeRestaurants = restaurantsWithCommissions.filter(r => r.isActive).length;
      const cashbackParticipants = restaurantsWithCommissions.filter(r => r.participatesInCashback).length;
      const totalPendingSettlement = formattedRestaurants.reduce((sum, r) => sum + r.pendingSettlement, 0);
      const totalSettled = formattedRestaurants.reduce((sum, r) => sum + r.totalSettled, 0);
      
      // Calculate total commission earned (5% of total settled as default)
      const avgCommissionRate = formattedRestaurants.length > 0 
        ? formattedRestaurants.reduce((sum, r) => sum + r.commissionRate, 0) / formattedRestaurants.length 
        : 5;
      const totalCommissionEarned = totalSettled * (avgCommissionRate / 100);
      const monthlyCommission = totalCommissionEarned * 0.1; // Approximation for monthly

      res.json({
        restaurants: formattedRestaurants,
        totals: {
          totalPendingSettlement,
          totalSettled,
          totalCommissionEarned,
          monthlyCommission,
          totalTransactions: restaurantsWithCommissions.length * 10, // Placeholder
          activeRestaurants,
          cashbackParticipants,
        }
      });
    } catch (error) {
      console.error("Error fetching restaurant commissions:", error);
      res.status(500).json({ message: "Failed to fetch restaurant commissions" });
    }
  });

  // 2. PATCH /api/admin/restaurants/:id/commission - Update restaurant commission rate
  app.patch("/api/admin/restaurants/:id/commission", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const { commissionRate, participatesInCashback, isCashbackParticipant, customCommissionNote } = req.body;

      if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
        return res.status(400).json({ message: "Commission rate must be between 0 and 100" });
      }

      const existingRestaurant = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      if (existingRestaurant.length === 0) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const updateData: any = { updatedAt: new Date() };
      if (commissionRate !== undefined) updateData.commissionRate = commissionRate.toString();
      // Support both field names for backwards compatibility
      if (participatesInCashback !== undefined) updateData.participatesInCashback = participatesInCashback;
      if (isCashbackParticipant !== undefined) updateData.participatesInCashback = isCashbackParticipant;
      if (customCommissionNote !== undefined) updateData.customCommissionNote = customCommissionNote;

      const [updated] = await db
        .update(restaurants)
        .set(updateData)
        .where(eq(restaurants.id, restaurantId))
        .returning();

      await logAdminAction(req.adminId!, 'update_commission', 'restaurant', restaurantId.toString(), existingRestaurant[0], updateData, req);
      res.json(updated);
    } catch (error) {
      console.error("Error updating restaurant commission:", error);
      res.status(500).json({ message: "Failed to update restaurant commission" });
    }
  });

  // 3. GET /api/admin/loyalty-tiers - List loyalty tiers (optionally filtered by marketplace)
  app.get("/api/admin/loyalty-tiers", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { marketplaceId } = req.query;
      
      let query = db
        .select({
          tier: eatoffLoyaltyTiers,
          marketplace: {
            id: marketplaces.id,
            name: marketplaces.name,
            currencyCode: marketplaces.currencyCode,
            currencySymbol: marketplaces.currencySymbol,
          }
        })
        .from(eatoffLoyaltyTiers)
        .leftJoin(marketplaces, eq(eatoffLoyaltyTiers.marketplaceId, marketplaces.id))
        .orderBy(asc(eatoffLoyaltyTiers.marketplaceId), asc(eatoffLoyaltyTiers.tierLevel));

      if (marketplaceId) {
        const mpId = parseInt(marketplaceId as string);
        query = query.where(eq(eatoffLoyaltyTiers.marketplaceId, mpId)) as any;
      }

      const results = await query;
      
      const tiers = results.map(r => ({
        ...r.tier,
        marketplace: r.marketplace?.id ? r.marketplace : null,
      }));

      res.json(tiers);
    } catch (error) {
      console.error("Error fetching loyalty tiers:", error);
      res.status(500).json({ message: "Failed to fetch loyalty tiers" });
    }
  });

  // 4. PUT /api/admin/loyalty-tiers/:id - Update loyalty tier settings
  app.put("/api/admin/loyalty-tiers/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const tierId = parseInt(req.params.id);
      const { 
        displayName, 
        cashbackPercentage, 
        minTransactionVolume, 
        maxTransactionVolume,
        color,
        icon,
        benefits,
        isActive 
      } = req.body;

      const existingTier = await db
        .select()
        .from(eatoffLoyaltyTiers)
        .where(eq(eatoffLoyaltyTiers.id, tierId))
        .limit(1);

      if (existingTier.length === 0) {
        return res.status(404).json({ message: "Loyalty tier not found" });
      }

      const updateData: any = { updatedAt: new Date() };
      if (displayName !== undefined) updateData.displayName = displayName;
      if (cashbackPercentage !== undefined) updateData.cashbackPercentage = cashbackPercentage.toString();
      if (minTransactionVolume !== undefined) updateData.minTransactionVolume = minTransactionVolume.toString();
      if (maxTransactionVolume !== undefined) updateData.maxTransactionVolume = maxTransactionVolume?.toString() || null;
      if (color !== undefined) updateData.color = color;
      if (icon !== undefined) updateData.icon = icon;
      if (benefits !== undefined) updateData.benefits = benefits;
      if (isActive !== undefined) updateData.isActive = isActive;

      const [updated] = await db
        .update(eatoffLoyaltyTiers)
        .set(updateData)
        .where(eq(eatoffLoyaltyTiers.id, tierId))
        .returning();

      await logAdminAction(req.adminId!, 'update_loyalty_tier', 'loyalty_tier', tierId.toString(), existingTier[0], updateData, req);
      res.json(updated);
    } catch (error) {
      console.error("Error updating loyalty tier:", error);
      res.status(500).json({ message: "Failed to update loyalty tier" });
    }
  });

  // 4b. POST /api/admin/loyalty-tiers - Create new loyalty tier for a marketplace
  app.post("/api/admin/loyalty-tiers", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      console.log("[Loyalty Tier Create] Received body:", JSON.stringify(req.body));
      const { marketplaceId, name, displayName, cashbackPercentage, minTransactionVolume, maxTransactionVolume, color, icon, tierLevel, benefits } = req.body;

      if (!marketplaceId || !name || !displayName || cashbackPercentage === undefined || minTransactionVolume === undefined || tierLevel === undefined) {
        console.log("[Loyalty Tier Create] Validation failed - missing fields");
        return res.status(400).json({ message: "marketplaceId, name, displayName, cashbackPercentage, minTransactionVolume, and tierLevel are required" });
      }

      const existingTier = await db.select().from(eatoffLoyaltyTiers)
        .where(and(
          eq(eatoffLoyaltyTiers.marketplaceId, marketplaceId),
          eq(eatoffLoyaltyTiers.name, name.toLowerCase())
        ))
        .limit(1);
      if (existingTier.length > 0) {
        return res.status(400).json({ message: "A tier with this name already exists for this marketplace" });
      }

      const [newTier] = await db.insert(eatoffLoyaltyTiers).values({
        marketplaceId,
        name: name.toLowerCase(),
        displayName,
        cashbackPercentage: cashbackPercentage.toString(),
        minTransactionVolume: minTransactionVolume.toString(),
        maxTransactionVolume: maxTransactionVolume?.toString() || null,
        color: color || '#808080',
        icon: icon || '🏅',
        tierLevel,
        benefits: benefits || [],
        isActive: true,
      }).returning();

      await logAdminAction(req.adminId!, 'create_loyalty_tier', 'loyalty_tier', newTier.id.toString(), null, newTier, req);
      res.status(201).json(newTier);
    } catch (error) {
      console.error("Error creating loyalty tier:", error);
      res.status(500).json({ message: "Failed to create loyalty tier" });
    }
  });

  // 4c. DELETE /api/admin/loyalty-tiers/:id - Delete loyalty tier
  app.delete("/api/admin/loyalty-tiers/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const tierId = parseInt(req.params.id);

      const existingTier = await db.select().from(eatoffLoyaltyTiers).where(eq(eatoffLoyaltyTiers.id, tierId)).limit(1);
      if (existingTier.length === 0) {
        return res.status(404).json({ message: "Loyalty tier not found" });
      }

      await db.delete(eatoffLoyaltyTiers).where(eq(eatoffLoyaltyTiers.id, tierId));
      await logAdminAction(req.adminId!, 'delete_loyalty_tier', 'loyalty_tier', tierId.toString(), existingTier[0], null, req);
      res.json({ message: "Loyalty tier deleted successfully" });
    } catch (error) {
      console.error("Error deleting loyalty tier:", error);
      res.status(500).json({ message: "Failed to delete loyalty tier" });
    }
  });

  // 4d. POST /api/admin/loyalty-tiers/seed - Seed default loyalty tiers for a marketplace
  app.post("/api/admin/loyalty-tiers/seed", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { marketplaceId } = req.body;
      
      if (!marketplaceId) {
        return res.status(400).json({ message: "marketplaceId is required" });
      }

      const marketplace = await db.select().from(marketplaces).where(eq(marketplaces.id, marketplaceId)).limit(1);
      if (marketplace.length === 0) {
        return res.status(404).json({ message: "Marketplace not found" });
      }

      const existingTiers = await db.select().from(eatoffLoyaltyTiers)
        .where(eq(eatoffLoyaltyTiers.marketplaceId, marketplaceId));
      if (existingTiers.length > 0) {
        return res.status(400).json({ message: "Loyalty tiers already exist for this marketplace. Delete them first if you want to reseed." });
      }

      const currencySymbol = marketplace[0].currencySymbol || '€';
      const defaultTiers = [
        { marketplaceId, name: 'bronze', displayName: 'Bronze', cashbackPercentage: '1.00', minTransactionVolume: '0.00', maxTransactionVolume: '500.00', color: '#CD7F32', icon: '🥉', tierLevel: 1, benefits: [`1% cashback on all purchases`] },
        { marketplaceId, name: 'silver', displayName: 'Silver', cashbackPercentage: '2.00', minTransactionVolume: '500.01', maxTransactionVolume: '2000.00', color: '#C0C0C0', icon: '🥈', tierLevel: 2, benefits: ['2% cashback on all purchases', 'Early access to deals'] },
        { marketplaceId, name: 'gold', displayName: 'Gold', cashbackPercentage: '3.00', minTransactionVolume: '2000.01', maxTransactionVolume: '5000.00', color: '#FFD700', icon: '🥇', tierLevel: 3, benefits: ['3% cashback on all purchases', 'Priority support', 'Exclusive offers'] },
        { marketplaceId, name: 'platinum', displayName: 'Platinum', cashbackPercentage: '4.00', minTransactionVolume: '5000.01', maxTransactionVolume: '15000.00', color: '#E5E4E2', icon: '💎', tierLevel: 4, benefits: ['4% cashback on all purchases', 'VIP support', 'Special events access'] },
        { marketplaceId, name: 'black', displayName: 'Black', cashbackPercentage: '5.00', minTransactionVolume: '15000.01', maxTransactionVolume: null, color: '#1C1C1C', icon: '⭐', tierLevel: 5, benefits: ['5% cashback on all purchases', 'Concierge service', 'All benefits included'] },
      ];

      const inserted = await db.insert(eatoffLoyaltyTiers).values(defaultTiers).returning();
      await logAdminAction(req.adminId!, 'seed_loyalty_tiers', 'loyalty_tier', `marketplace_${marketplaceId}`, null, { count: inserted.length, marketplaceId }, req);
      res.status(201).json({ message: `Successfully seeded ${inserted.length} loyalty tiers for ${marketplace[0].name}`, tiers: inserted });
    } catch (error) {
      console.error("Error seeding loyalty tiers:", error);
      res.status(500).json({ message: "Failed to seed loyalty tiers" });
    }
  });

  // 5a. GET /api/admin/settlements/metrics - Get settlement metrics for dashboard
  app.get("/api/admin/settlements/metrics", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const pendingResult = await db
        .select({
          count: sql<number>`COUNT(*)`,
          sum: sql<number>`COALESCE(SUM(${restaurantSettlements.netAmount}::numeric), 0)`,
        })
        .from(restaurantSettlements)
        .where(eq(restaurantSettlements.status, 'pending'));

      const paidResult = await db
        .select({
          sum: sql<number>`COALESCE(SUM(${restaurantSettlements.netAmount}::numeric), 0)`,
        })
        .from(restaurantSettlements)
        .where(eq(restaurantSettlements.status, 'paid'));

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const thisWeekResult = await db
        .select({
          sum: sql<number>`COALESCE(SUM(${restaurantSettlements.netAmount}::numeric), 0)`,
        })
        .from(restaurantSettlements)
        .where(gte(restaurantSettlements.createdAt, startOfWeek));

      const avgCommissionResult = await db
        .select({
          avg: sql<number>`COALESCE(AVG(${restaurantSettlements.commissionRate}::numeric), 0)`,
        })
        .from(restaurantSettlements);

      res.json({
        pendingCount: Number(pendingResult[0]?.count) || 0,
        pendingSum: Number(pendingResult[0]?.sum) || 0,
        thisWeekSum: Number(thisWeekResult[0]?.sum) || 0,
        totalPaidOut: Number(paidResult[0]?.sum) || 0,
        avgCommissionRate: Number(avgCommissionResult[0]?.avg) || 0,
      });
    } catch (error) {
      console.error("Error fetching settlement metrics:", error);
      res.status(500).json({ message: "Failed to fetch settlement metrics" });
    }
  });

  // 5b. POST /api/admin/settlements/send-emails - Send settlement PDFs (placeholder)
  app.post("/api/admin/settlements/send-emails", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { settlementIds } = req.body;
      
      await logAdminAction(req.adminId!, 'send_settlement_emails', 'settlement', JSON.stringify(settlementIds), null, { settlementIds }, req);
      
      res.json({ 
        message: "Settlement emails queued for sending",
        count: settlementIds?.length || 0,
        status: "pending_implementation"
      });
    } catch (error) {
      console.error("Error sending settlement emails:", error);
      res.status(500).json({ message: "Failed to send settlement emails" });
    }
  });

  // 5c. GET /api/admin/settlements/:id/transactions - Get transactions for a settlement
  app.get("/api/admin/settlements/:id/transactions", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const settlementId = parseInt(req.params.id);

      const settlement = await db
        .select()
        .from(restaurantSettlements)
        .where(eq(restaurantSettlements.id, settlementId))
        .limit(1);

      if (settlement.length === 0) {
        return res.status(404).json({ message: "Settlement not found" });
      }

      const transactions = await db
        .select({
          id: walletTransactions.id,
          amount: walletTransactions.amount,
          transactionType: walletTransactions.transactionType,
          description: walletTransactions.description,
          createdAt: walletTransactions.createdAt,
        })
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.restaurantId, settlement[0].restaurantId),
            gte(walletTransactions.createdAt, settlement[0].periodStart),
            sql`${walletTransactions.createdAt} <= ${settlement[0].periodEnd}`
          )
        )
        .orderBy(desc(walletTransactions.createdAt));

      res.json({
        settlement: settlement[0],
        transactions,
      });
    } catch (error) {
      console.error("Error fetching settlement transactions:", error);
      res.status(500).json({ message: "Failed to fetch settlement transactions" });
    }
  });

  // 5d. POST /api/admin/settlements/generate-all - Generate settlements for all restaurants
  app.post("/api/admin/settlements/generate-all", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const allRestaurants = await db
        .select({
          id: restaurants.id,
          name: restaurants.name,
          commissionRate: restaurants.commissionRate,
        })
        .from(restaurants)
        .where(eq(restaurants.isActive, true));

      const settlements = [];
      
      for (const restaurant of allRestaurants) {
        const transactions = await db
          .select({
            amount: walletTransactions.amount,
          })
          .from(walletTransactions)
          .where(
            and(
              eq(walletTransactions.restaurantId, restaurant.id),
              gte(walletTransactions.createdAt, startDate),
              sql`${walletTransactions.createdAt} <= ${endDate}`
            )
          );

        if (transactions.length === 0) continue;

        const grossAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
        if (grossAmount <= 0) continue;

        const commissionRate = parseFloat(restaurant.commissionRate || '6.00');
        const commissionAmount = Math.round(grossAmount * (commissionRate / 100) * 100) / 100;
        const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

        const [settlement] = await db
          .insert(restaurantSettlements)
          .values({
            restaurantId: restaurant.id,
            periodStart: startDate,
            periodEnd: endDate,
            grossAmount: grossAmount.toString(),
            commissionAmount: commissionAmount.toString(),
            commissionRate: commissionRate.toString(),
            netAmount: netAmount.toString(),
            transactionCount: transactions.length,
            status: 'pending',
          })
          .returning();

        settlements.push({
          ...settlement,
          restaurantName: restaurant.name,
        });
      }

      await logAdminAction(req.adminId!, 'generate_all_settlements', 'settlement', null, null, { count: settlements.length }, req);
      
      res.json({
        message: `Generated ${settlements.length} settlements`,
        count: settlements.length,
        settlements,
      });
    } catch (error) {
      console.error("Error generating settlements:", error);
      res.status(500).json({ message: "Failed to generate settlements" });
    }
  });

  // 5. GET /api/admin/settlements - List all settlements with filters
  app.get("/api/admin/settlements", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { status, restaurantId, startDate, endDate, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = db
        .select({
          settlement: restaurantSettlements,
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
            restaurantCode: restaurants.restaurantCode,
            stripeConnectAccountId: restaurants.stripeConnectAccountId,
          }
        })
        .from(restaurantSettlements)
        .leftJoin(restaurants, eq(restaurantSettlements.restaurantId, restaurants.id))
        .orderBy(desc(restaurantSettlements.createdAt))
        .limit(limitNum)
        .offset(offset);

      const conditions: any[] = [];
      if (status) conditions.push(eq(restaurantSettlements.status, status as string));
      if (restaurantId) conditions.push(eq(restaurantSettlements.restaurantId, parseInt(restaurantId as string)));
      if (startDate) conditions.push(gte(restaurantSettlements.periodStart, new Date(startDate as string)));
      if (endDate) {
        const { lte } = await import('drizzle-orm');
        conditions.push(lte(restaurantSettlements.periodEnd, new Date(endDate as string)));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const settlements = await query;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(restaurantSettlements);
      const total = countResult[0]?.count || 0;

      res.json({
        settlements: settlements.map(s => ({ ...s.settlement, restaurant: s.restaurant })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(Number(total) / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching settlements:", error);
      res.status(500).json({ message: "Failed to fetch settlements" });
    }
  });

  // 6. POST /api/admin/settlements/generate - Generate weekly settlement report
  app.post("/api/admin/settlements/generate", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { restaurantId, periodStart, periodEnd } = req.body;

      if (!restaurantId || !periodStart || !periodEnd) {
        return res.status(400).json({ message: "restaurantId, periodStart, and periodEnd are required" });
      }

      const restaurant = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, parseInt(restaurantId)))
        .limit(1);

      if (restaurant.length === 0) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const startDate = new Date(periodStart);
      const endDate = new Date(periodEnd);

      const transactions = await db
        .select({
          amount: walletTransactions.amount,
        })
        .from(walletTransactions)
        .where(
          and(
            eq(walletTransactions.restaurantId, parseInt(restaurantId)),
            gte(walletTransactions.createdAt, startDate),
            sql`${walletTransactions.createdAt} <= ${endDate}`
          )
        );

      const grossAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
      const commissionRate = parseFloat(restaurant[0].commissionRate || '6.00');
      const commissionAmount = Math.round(grossAmount * (commissionRate / 100) * 100) / 100;
      const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

      const [settlement] = await db
        .insert(restaurantSettlements)
        .values({
          restaurantId: parseInt(restaurantId),
          periodStart: startDate,
          periodEnd: endDate,
          grossAmount: grossAmount.toString(),
          commissionAmount: commissionAmount.toString(),
          commissionRate: commissionRate.toString(),
          netAmount: netAmount.toString(),
          transactionCount: transactions.length,
          status: 'pending',
        })
        .returning();

      await db
        .update(restaurants)
        .set({ 
          pendingSettlementAmount: sql`${restaurants.pendingSettlementAmount} + ${netAmount}`,
          updatedAt: new Date() 
        })
        .where(eq(restaurants.id, parseInt(restaurantId)));

      await logAdminAction(req.adminId!, 'generate_settlement', 'settlement', settlement.id.toString(), null, settlement, req);
      res.json(settlement);
    } catch (error) {
      console.error("Error generating settlement:", error);
      res.status(500).json({ message: "Failed to generate settlement" });
    }
  });

  // 7. PATCH /api/admin/settlements/:id/mark-paid - Mark settlement as paid
  app.patch("/api/admin/settlements/:id/mark-paid", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const settlementId = parseInt(req.params.id);
      const { paymentMethod, paymentReference } = req.body;

      const existingSettlement = await db
        .select()
        .from(restaurantSettlements)
        .where(eq(restaurantSettlements.id, settlementId))
        .limit(1);

      if (existingSettlement.length === 0) {
        return res.status(404).json({ message: "Settlement not found" });
      }

      if (existingSettlement[0].status === 'paid') {
        return res.status(400).json({ message: "Settlement is already marked as paid" });
      }

      const [updated] = await db
        .update(restaurantSettlements)
        .set({
          status: 'paid',
          paymentMethod: paymentMethod || 'manual',
          paymentReference: paymentReference || null,
          paidAt: new Date(),
          paidBy: req.adminId,
        })
        .where(eq(restaurantSettlements.id, settlementId))
        .returning();

      const netAmount = parseFloat(existingSettlement[0].netAmount || '0');
      await db
        .update(restaurants)
        .set({
          pendingSettlementAmount: sql`GREATEST(0, ${restaurants.pendingSettlementAmount} - ${netAmount})`,
          totalSettledAmount: sql`${restaurants.totalSettledAmount} + ${netAmount}`,
          lastSettlementDate: new Date(),
          updatedAt: new Date()
        })
        .where(eq(restaurants.id, existingSettlement[0].restaurantId));

      await logAdminAction(req.adminId!, 'mark_settlement_paid', 'settlement', settlementId.toString(), existingSettlement[0], updated, req);
      res.json(updated);
    } catch (error) {
      console.error("Error marking settlement as paid:", error);
      res.status(500).json({ message: "Failed to mark settlement as paid" });
    }
  });

  // 8. GET /api/admin/users/financial - List users with wallet balance, cashback, tier (paginated)
  app.get("/api/admin/users/financial", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const { page = '1', search } = req.query;
      const pageNum = parseInt(page as string);
      const limit = 50;
      const offset = (pageNum - 1) * limit;

      let query = db
        .select({
          customer: {
            id: customers.id,
            email: customers.email,
            name: customers.name,
            membershipTier: customers.membershipTier,
            loyaltyPoints: customers.loyaltyPoints,
            balance: customers.balance,
            createdAt: customers.createdAt,
          },
          wallet: {
            cashBalance: customerWallets.cashBalance,
            loyaltyPoints: customerWallets.loyaltyPoints,
            totalPointsEarned: customerWallets.totalPointsEarned,
            isActive: customerWallets.isActive,
          }
        })
        .from(customers)
        .leftJoin(customerWallets, eq(customers.id, customerWallets.customerId))
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset);

      if (search) {
        query = query.where(
          sql`${customers.email} ILIKE ${'%' + search + '%'} OR ${customers.name} ILIKE ${'%' + search + '%'}`
        ) as any;
      }

      const users = await query;

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers);
      const total = countResult[0]?.count || 0;

      res.json({
        users: users.map(u => ({
          customer: u.customer,
          wallet: u.wallet
        })),
        pagination: {
          page: pageNum,
          limit,
          total,
          totalPages: Math.ceil(Number(total) / limit)
        }
      });
    } catch (error) {
      console.error("Error fetching users financial data:", error);
      res.status(500).json({ message: "Failed to fetch users financial data" });
    }
  });

  // 9. GET /api/admin/users/:id/transactions - Get user transaction history (paginated)
  app.get("/api/admin/users/:id/transactions", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id);
      const { page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (customer.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const transactions = await db
        .select({
          transaction: walletTransactions,
          restaurant: {
            id: restaurants.id,
            name: restaurants.name,
          }
        })
        .from(walletTransactions)
        .leftJoin(restaurants, eq(walletTransactions.restaurantId, restaurants.id))
        .where(eq(walletTransactions.customerId, customerId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(limitNum)
        .offset(offset);

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(walletTransactions)
        .where(eq(walletTransactions.customerId, customerId));
      const total = countResult[0]?.count || 0;

      res.json({
        customer: customer[0],
        transactions: transactions.map(t => ({ ...t.transaction, restaurant: t.restaurant })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(Number(total) / limitNum)
        }
      });
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  // 10. POST /api/admin/users/:id/wallet-adjustment - Create manual wallet adjustment
  app.post("/api/admin/users/:id/wallet-adjustment", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.id);
      const { adjustmentType, amount, reason } = req.body;
      if (!adjustmentType || !amount || !reason) {
        return res.status(400).json({ message: "adjustmentType, amount, and reason are required" });
      }

      if (!['credit', 'debit', 'bonus', 'correction'].includes(adjustmentType)) {
        return res.status(400).json({ message: "Invalid adjustment type. Must be: credit, debit, bonus, or correction" });
      }

      if (reason.trim().length < 10) {
        return res.status(400).json({ message: "Reason must be at least 10 characters" });
      }

      const customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, customerId))
        .limit(1);

      if (customer.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const wallet = await db
        .select({
          id: customerWallets.id,
          customerId: customerWallets.customerId,
          cashBalance: customerWallets.cashBalance,
          loyaltyPoints: customerWallets.loyaltyPoints,
          totalPointsEarned: customerWallets.totalPointsEarned,
          isActive: customerWallets.isActive,
        })
        .from(customerWallets)
        .where(eq(customerWallets.customerId, customerId))
        .limit(1);

      const currentBalance = wallet.length > 0 ? parseFloat(wallet[0].cashBalance || '0') : 0;
      const adjustmentAmount = parseFloat(amount);
      
      let newBalance: number;
      if (adjustmentType === 'debit') {
        newBalance = Math.max(0, currentBalance - Math.abs(adjustmentAmount));
      } else {
        newBalance = currentBalance + Math.abs(adjustmentAmount);
      }

      const [adjustment] = await db
        .insert(walletAdjustments)
        .values({
          customerId,
          adjustmentType,
          amount: adjustmentAmount.toString(),
          balanceBefore: currentBalance.toString(),
          balanceAfter: newBalance.toString(),
          reason: reason.trim(),
          adminId: req.adminId,
        })
        .returning();

      if (wallet.length > 0) {
        await db
          .update(customerWallets)
          .set({ cashBalance: newBalance.toString(), updatedAt: new Date() })
          .where(eq(customerWallets.customerId, customerId));
      } else {
        await db
          .insert(customerWallets)
          .values({
            customerId,
            cashBalance: newBalance.toString(),
            loyaltyPoints: 0,
            totalPointsEarned: 0,
          });
      }

      // Also sync customers.balance for mobile wallet consistency
      await db
        .update(customers)
        .set({ balance: newBalance.toString() })
        .where(eq(customers.id, customerId));

      await db
        .insert(walletTransactions)
        .values({
          customerId,
          transactionType: `admin_${adjustmentType}`,
          amount: adjustmentAmount.toString(),
          description: `Admin adjustment: ${reason}`,
          balanceBefore: currentBalance.toString(),
          balanceAfter: newBalance.toString(),
        });

      await logAdminAction(req.adminId!, 'wallet_adjustment', 'customer', customerId.toString(), { balance: currentBalance }, adjustment, req);
      res.json(adjustment);
    } catch (error) {
      console.error("Error creating wallet adjustment:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: `Failed to create wallet adjustment: ${errMsg}` });
    }
  });

  // Stripe Connect: Create account link for restaurant onboarding
  app.post("/api/admin/restaurants/:id/stripe-connect", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);

      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      let stripeAccountId = restaurant.stripeConnectAccountId;

      if (!stripeAccountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          country: 'RO',
          email: restaurant.email || undefined,
          business_type: 'company',
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: {
            restaurant_id: restaurantId.toString(),
            restaurant_name: restaurant.name,
          },
        });

        stripeAccountId = account.id;

        await db
          .update(restaurants)
          .set({ stripeConnectAccountId: account.id })
          .where(eq(restaurants.id, restaurantId));
      }

      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : process.env.BASE_URL || 'http://localhost:5000';

      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: `${baseUrl}/admin`,
        return_url: `${baseUrl}/admin?stripe_success=true&restaurant_id=${restaurantId}`,
        type: 'account_onboarding',
      });

      await logAdminAction(
        req.adminId!,
        'create_stripe_connect_link',
        'restaurant',
        restaurantId.toString(),
        null,
        { stripeAccountId },
        req
      );

      res.json({
        url: accountLink.url,
        stripeAccountId,
      });
    } catch (error: any) {
      console.error("Error creating Stripe Connect account link:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create Stripe Connect account link" 
      });
    }
  });

  // Stripe Connect: Check onboarding status
  app.get("/api/admin/restaurants/:id/stripe-status", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);

      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId))
        .limit(1);

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      if (!restaurant.stripeConnectAccountId) {
        return res.json({
          hasStripeAccount: false,
          isOnboarded: false,
          payoutsEnabled: false,
          chargesEnabled: false,
        });
      }

      const account = await stripe.accounts.retrieve(restaurant.stripeConnectAccountId);

      res.json({
        hasStripeAccount: true,
        isOnboarded: account.details_submitted,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        stripeAccountId: restaurant.stripeConnectAccountId,
      });
    } catch (error: any) {
      console.error("Error checking Stripe status:", error);
      res.status(500).json({ 
        message: error.message || "Failed to check Stripe status" 
      });
    }
  });

  // Stripe Connect: Process payout for a settlement
  app.post("/api/admin/settlements/:id/payout", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const settlementId = parseInt(req.params.id);

      const [settlement] = await db
        .select()
        .from(restaurantSettlements)
        .where(eq(restaurantSettlements.id, settlementId))
        .limit(1);

      if (!settlement) {
        return res.status(404).json({ message: "Settlement not found" });
      }

      if (settlement.status === 'paid') {
        return res.status(400).json({ message: "Settlement is already paid" });
      }

      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, settlement.restaurantId))
        .limit(1);

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      if (!restaurant.stripeConnectAccountId) {
        return res.status(400).json({ 
          message: "Restaurant has not completed Stripe Connect onboarding" 
        });
      }

      const account = await stripe.accounts.retrieve(restaurant.stripeConnectAccountId);
      if (!account.payouts_enabled) {
        return res.status(400).json({ 
          message: "Restaurant's Stripe account is not fully onboarded or payouts are disabled" 
        });
      }

      const amountInCents = Math.round(parseFloat(settlement.netAmount) * 100);

      if (amountInCents <= 0) {
        return res.status(400).json({ message: "Settlement amount must be greater than zero" });
      }

      const transfer = await stripe.transfers.create({
        amount: amountInCents,
        currency: 'eur',
        destination: restaurant.stripeConnectAccountId,
        transfer_group: `settlement_${settlementId}`,
        metadata: {
          settlement_id: settlementId.toString(),
          restaurant_id: restaurant.id.toString(),
          restaurant_name: restaurant.name,
          period_start: settlement.periodStart.toISOString(),
          period_end: settlement.periodEnd.toISOString(),
        },
      });

      const [updatedSettlement] = await db
        .update(restaurantSettlements)
        .set({
          status: 'paid',
          paidAt: new Date(),
          paymentMethod: 'stripe_connect',
          paymentReference: transfer.id,
        })
        .where(eq(restaurantSettlements.id, settlementId))
        .returning();

      await logAdminAction(
        req.adminId!,
        'process_stripe_payout',
        'settlement',
        settlementId.toString(),
        { status: settlement.status },
        { status: 'paid', transferId: transfer.id },
        req
      );

      res.json({
        message: "Payout processed successfully",
        transferId: transfer.id,
        amount: settlement.netAmount,
        settlement: updatedSettlement,
      });
    } catch (error: any) {
      console.error("Error processing Stripe payout:", error);
      res.status(500).json({ 
        message: error.message || "Failed to process Stripe payout" 
      });
    }
  });

  // ==================== Marketing Deals ====================

  app.get("/api/admin/marketing-deals", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const deals = await db.select().from(marketingDeals).orderBy(asc(marketingDeals.sortOrder));

      const dealsWithRestaurants = await Promise.all(
        deals.map(async (deal) => {
          const associations = await db
            .select({
              id: restaurants.id,
              name: restaurants.name,
              imageUrl: restaurants.imageUrl,
              cuisine: restaurants.cuisine,
              location: restaurants.location,
              rating: restaurants.rating,
            })
            .from(marketingDealRestaurants)
            .innerJoin(restaurants, eq(marketingDealRestaurants.restaurantId, restaurants.id))
            .where(eq(marketingDealRestaurants.dealId, deal.id));
          return { ...deal, restaurants: associations };
        })
      );

      res.json(dealsWithRestaurants);
    } catch (error) {
      console.error("Error fetching marketing deals:", error);
      res.status(500).json({ message: "Failed to fetch marketing deals" });
    }
  });

  app.post("/api/admin/marketing-deals", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const parsed = insertMarketingDealSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid data", errors: parsed.error.errors });
      }

      const [deal] = await db.insert(marketingDeals).values(parsed.data).returning();
      await logAdminAction(req.adminId!, "create_marketing_deal", "marketing_deal", deal.id.toString(), undefined, parsed.data, req);
      res.status(201).json(deal);
    } catch (error) {
      console.error("Error creating marketing deal:", error);
      res.status(500).json({ message: "Failed to create marketing deal" });
    }
  });

  app.patch("/api/admin/marketing-deals/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) return res.status(400).json({ message: "Invalid deal ID" });

      const existing = await db.select().from(marketingDeals).where(eq(marketingDeals.id, dealId)).limit(1);
      if (existing.length === 0) return res.status(404).json({ message: "Deal not found" });

      const [updated] = await db.update(marketingDeals).set(req.body).where(eq(marketingDeals.id, dealId)).returning();
      await logAdminAction(req.adminId!, "update_marketing_deal", "marketing_deal", dealId.toString(), existing[0], req.body, req);
      res.json(updated);
    } catch (error) {
      console.error("Error updating marketing deal:", error);
      res.status(500).json({ message: "Failed to update marketing deal" });
    }
  });

  app.delete("/api/admin/marketing-deals/:id", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) return res.status(400).json({ message: "Invalid deal ID" });

      await db.delete(marketingDealRestaurants).where(eq(marketingDealRestaurants.dealId, dealId));
      const [deleted] = await db.delete(marketingDeals).where(eq(marketingDeals.id, dealId)).returning();
      if (!deleted) return res.status(404).json({ message: "Deal not found" });

      await logAdminAction(req.adminId!, "delete_marketing_deal", "marketing_deal", dealId.toString(), deleted, undefined, req);
      res.json({ message: "Deal deleted successfully" });
    } catch (error) {
      console.error("Error deleting marketing deal:", error);
      res.status(500).json({ message: "Failed to delete marketing deal" });
    }
  });

  app.post("/api/admin/marketing-deals/:id/restaurants", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      if (isNaN(dealId)) return res.status(400).json({ message: "Invalid deal ID" });

      const { restaurantIds } = req.body;
      if (!Array.isArray(restaurantIds) || restaurantIds.length === 0) {
        return res.status(400).json({ message: "restaurantIds array is required" });
      }

      const values = restaurantIds.map((restaurantId: number) => ({
        dealId,
        restaurantId,
      }));

      await db.insert(marketingDealRestaurants).values(values);
      await logAdminAction(req.adminId!, "add_deal_restaurants", "marketing_deal", dealId.toString(), undefined, { restaurantIds }, req);
      res.status(201).json({ message: "Restaurants added to deal" });
    } catch (error) {
      console.error("Error adding restaurants to deal:", error);
      res.status(500).json({ message: "Failed to add restaurants to deal" });
    }
  });

  app.delete("/api/admin/marketing-deals/:id/restaurants/:restaurantId", adminAuth, async (req: AdminAuthRequest, res: Response) => {
    try {
      const dealId = parseInt(req.params.id);
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(dealId) || isNaN(restaurantId)) return res.status(400).json({ message: "Invalid IDs" });

      await db
        .delete(marketingDealRestaurants)
        .where(and(eq(marketingDealRestaurants.dealId, dealId), eq(marketingDealRestaurants.restaurantId, restaurantId)));

      await logAdminAction(req.adminId!, "remove_deal_restaurant", "marketing_deal", dealId.toString(), undefined, { restaurantId }, req);
      res.json({ message: "Restaurant removed from deal" });
    } catch (error) {
      console.error("Error removing restaurant from deal:", error);
      res.status(500).json({ message: "Failed to remove restaurant from deal" });
    }
  });
}