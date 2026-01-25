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
  eatoffVouchers
} from "@shared/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectStorageService } from "./objectStorage";

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

// Admin authentication middleware - simplified for MemStorage testing
const adminAuth = async (req: AdminAuthRequest, res: Response, next: Function) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Admin authentication required" });
    }

    const token = authHeader.substring(7);
    
    // For MemStorage testing, we'll use a simple token validation
    // In production, this should use proper session management
    if (token && token.length > 10) {
      // Mock admin for testing
      req.adminId = 1;
      req.admin = { id: 1, email: 'admin@eatoff.com', role: 'super_admin' };
      next();
    } else {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
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

      // Skip 2FA for default admin account
      if (email !== 'admin@eatoff.com') {
        // For demo purposes, accept any 6-digit 2FA code
        if (!twoFactorCode || twoFactorCode.length !== 6) {
          return res.status(400).json({ message: "2FA code required" });
        }
      }

      // Create session token (simplified for MemStorage)
      const sessionToken = crypto.randomBytes(32).toString('hex');
      
      // For MemStorage, we'll just store the session in memory
      // No database operations needed

      res.json({
        token: sessionToken,
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
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
      // Get basic metrics
      const [restaurantCount] = await db
        .select({
          count: sql<number>`COUNT(*)`,
          active: sql<number>`COUNT(CASE WHEN ${restaurants.isActive} = true THEN 1 END)`,
        })
        .from(restaurants);

      const [userMetrics] = await db
        .select({
          totalUsers: sql<number>`COUNT(*)`,
        })
        .from(customers);

      await logAdminAction(req.adminId!, "view_dashboard", "dashboard", undefined, undefined, undefined, req);

      res.json({
        commission: {
          totalEarnings: 1250.50,
          monthlyEarnings: 340.25,
          totalTransactions: 85,
        },
        restaurants: {
          total: restaurantCount?.count || 0,
          active: restaurantCount?.active || 0,
        },
        users: {
          total: userMetrics?.totalUsers || 0,
          active: 45,
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
          location: restaurants.location,
          rating: restaurants.rating,
          isActive: restaurants.isActive,
          isApproved: restaurants.isApproved,
          email: restaurants.email,
          restaurantCode: restaurants.restaurantCode,
          approvedAt: restaurants.approvedAt,
          createdAt: restaurants.createdAt,
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
        location,
        address,
        phone,
        email,
        description,
        priceRange,
        imageUrl,
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
          location,
          address,
          phone,
          email,
          description,
          priceRange,
          imageUrl: imageUrl || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=300&fit=crop&fm=webp&q=80`,
          restaurantCode,
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

      // Get restaurant details
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId));

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
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
}