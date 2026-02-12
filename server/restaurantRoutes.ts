import { Router } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { 
  insertRestaurantOwnerSchema, 
  loginRestaurantOwnerSchema,
  insertRestaurantSchema,
  insertVoucherPackageSchema,
  insertMenuItemSchema,
  chefProfiles,
  menuItems,
  restaurants,
  passwordResetTokens,
  restaurantOwners
} from "@shared/schema";
import { eq, and, sql, desc, inArray, gt } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

// Restaurant Owner Registration
router.post("/register", async (req, res) => {
  try {
    const { password, ...ownerData } = insertRestaurantOwnerSchema.parse(req.body);
    
    // Check if email already exists
    const existingOwner = await storage.getRestaurantOwnerByEmail(ownerData.email);
    if (existingOwner) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create owner account
    const newOwner = await storage.createRestaurantOwner({
      ...ownerData,
      passwordHash
    });

    // Set session
    req.session.ownerId = newOwner.id;
    
    res.status(201).json({
      id: newOwner.id,
      email: newOwner.email,
      companyName: newOwner.companyName,
      isVerified: newOwner.isVerified,
      isActive: newOwner.isActive
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(400).json({ message: error.message || "Registration failed" });
  }
});

// Restaurant Owner Login
router.post("/login", async (req, res) => {
  try {
    const loginData = loginRestaurantOwnerSchema.parse(req.body);
    
    // Find owner by email
    const owner = await storage.getRestaurantOwnerByEmail(loginData.email);
    if (!owner) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(loginData.password, owner.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if account is active
    if (!owner.isActive) {
      return res.status(401).json({ message: "Account is inactive" });
    }

    // Set session
    req.session.ownerId = owner.id;
    
    res.json({
      id: owner.id,
      email: owner.email,
      companyName: owner.companyName,
      isVerified: owner.isVerified,
      isActive: owner.isActive
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(400).json({ message: error.message || "Login failed" });
  }
});

// Restaurant Owner Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// Restaurant Owner Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const owner = await storage.getRestaurantOwnerByEmail(email);
    
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      email: email.toLowerCase().trim(),
      token,
      userType: "restaurant_owner",
      expiresAt,
    });

    if (owner) {
      console.log(`[Password Reset] Restaurant owner reset token for ${email}: ${token}`);
    }

    res.json({ 
      message: "Dacă emailul există în sistem, un cod de resetare a fost generat.",
      token: token
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
});

// Restaurant Owner Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Parola trebuie să aibă minim 8 caractere" });
    }

    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.userType, "restaurant_owner")
        )
      )
      .limit(1);

    if (!resetToken) {
      return res.status(400).json({ message: "Token invalid sau expirat" });
    }

    if (resetToken.usedAt) {
      return res.status(400).json({ message: "Acest token a fost deja folosit" });
    }

    if (new Date() > resetToken.expiresAt) {
      return res.status(400).json({ message: "Tokenul a expirat. Solicită un nou cod de resetare." });
    }

    const owner = await storage.getRestaurantOwnerByEmail(resetToken.email);
    if (!owner) {
      return res.status(400).json({ message: "Contul nu a fost găsit" });
    }

    const newPasswordHash = await hashPassword(newPassword);
    await db.update(restaurantOwners)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(restaurantOwners.id, owner.id));

    await db.update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    console.log(`[Password Reset] Restaurant owner password reset successful for ${resetToken.email}`);

    res.json({ message: "Parola a fost resetată cu succes!" });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

// Get current owner authentication status
router.get("/auth/user", async (req, res) => {
  try {
    const ownerId = req.session?.ownerId;
    
    if (!ownerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get owner details
    const owner = await storage.getRestaurantOwnerById(ownerId);
    if (!owner || !owner.isActive) {
      req.session = null;
      return res.status(401).json({ message: "Account not found or inactive" });
    }

    res.json({
      id: owner.id,
      email: owner.email,
      companyName: owner.companyName,
      isVerified: owner.isVerified,
      isActive: owner.isActive
    });
  } catch (error: any) {
    console.error("Auth check error:", error);
    res.status(500).json({ message: "Authentication check failed" });
  }
});

// Get current owner profile
router.get("/profile", requireAuth, async (req, res) => {
  try {
    res.json({
      id: req.owner.id,
      email: req.owner.email,
      companyName: req.owner.companyName,
      businessRegistrationNumber: req.owner.businessRegistrationNumber,
      taxId: req.owner.taxId,
      companyAddress: req.owner.companyAddress,
      companyPhone: req.owner.companyPhone,
      companyWebsite: req.owner.companyWebsite,
      contactPersonName: req.owner.contactPersonName,
      contactPersonTitle: req.owner.contactPersonTitle,
      contactPersonPhone: req.owner.contactPersonPhone,
      contactPersonEmail: req.owner.contactPersonEmail,
      isVerified: req.owner.isVerified,
      isActive: req.owner.isActive,
      createdAt: req.owner.createdAt
    });
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Get owner's restaurants
router.get("/restaurants", requireAuth, async (req, res) => {
  try {
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    res.json(restaurants);
  } catch (error: any) {
    console.error("Restaurants fetch error:", error);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
});

// Create a new restaurant
router.post("/restaurants", requireAuth, async (req, res) => {
  try {
    const restaurantData = insertRestaurantSchema.parse({
      ...req.body,
      ownerId: req.ownerId,
      isApproved: false // Requires admin approval
    });
    
    const newRestaurant = await storage.createRestaurant(restaurantData);
    res.status(201).json(newRestaurant);
  } catch (error: any) {
    console.error("Restaurant creation error:", error);
    res.status(400).json({ message: error.message || "Failed to create restaurant" });
  }
});

// Update restaurant
router.put("/restaurants/:id", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    
    // Verify ownership
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    const ownsRestaurant = restaurants.some(r => r.id === restaurantId);
    
    if (!ownsRestaurant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = req.body;
    const updatedRestaurant = await storage.updateRestaurant(restaurantId, updates);
    
    if (!updatedRestaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    res.json(updatedRestaurant);
  } catch (error: any) {
    console.error("Restaurant update error:", error);
    res.status(400).json({ message: error.message || "Failed to update restaurant" });
  }
});

// Delete restaurant
router.delete("/restaurants/:id", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    
    // Verify ownership
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    const ownsRestaurant = restaurants.some(r => r.id === restaurantId);
    
    if (!ownsRestaurant) {
      return res.status(403).json({ message: "Access denied" });
    }

    await storage.deleteRestaurant(restaurantId);
    res.json({ message: "Restaurant deleted successfully" });
  } catch (error: any) {
    console.error("Restaurant deletion error:", error);
    res.status(400).json({ message: error.message || "Failed to delete restaurant" });
  }
});

// Get owner's restaurants
router.get("/restaurants", requireAuth, async (req, res) => {
  try {
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    res.json(restaurants);
  } catch (error: any) {
    console.error("Restaurants fetch error:", error);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
});

// Get voucher packages for all owner's restaurants
router.get("/packages", requireAuth, async (req, res) => {
  try {
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    const restaurantIds = restaurants.map(r => r.id);
    
    const allPackages = [];
    for (const restaurantId of restaurantIds) {
      const packages = await storage.getPackagesByRestaurant(restaurantId);
      // Add restaurant info to each package
      const restaurant = restaurants.find(r => r.id === restaurantId);
      const packagesWithRestaurant = packages.map(pkg => ({
        ...pkg,
        restaurantName: restaurant?.name,
        restaurantId: restaurant?.id
      }));
      allPackages.push(...packagesWithRestaurant);
    }
    
    res.json(allPackages);
  } catch (error: any) {
    console.error("Packages fetch error:", error);
    res.status(500).json({ message: "Failed to fetch packages" });
  }
});

// Get voucher templates
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const templates = await storage.getVoucherTemplates();
    res.json(templates);
  } catch (error: any) {
    console.error("Templates fetch error:", error);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
});

// Update owner account information
router.put("/owner/account", requireAuth, async (req, res) => {
  try {
    const { companyName, email, contactPersonName, companyPhone, companyAddress } = req.body;
    
    const updatedOwner = await storage.updateRestaurantOwner(req.ownerId!, {
      companyName,
      email,
      contactPersonName,
      companyPhone,
      companyAddress
    });
    
    res.json(updatedOwner);
  } catch (error: any) {
    console.error("Account update error:", error);
    res.status(400).json({ message: error.message || "Failed to update account information" });
  }
});

// Change owner password
router.put("/owner/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    // Get current owner to verify current password
    const owner = await storage.getRestaurantOwnerById(req.ownerId!);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    // Verify current password
    const { verifyPassword } = await import('./auth.js');
    const isCurrentPasswordValid = await verifyPassword(currentPassword, owner.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const { hashPassword } = await import('./auth.js');
    const hashedNewPassword = await hashPassword(newPassword);
    
    // Update password
    await storage.updateRestaurantOwner(req.ownerId!, {
      passwordHash: hashedNewPassword
    });
    
    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("Password change error:", error);
    res.status(400).json({ message: error.message || "Failed to change password" });
  }
});

// Add new user to company
router.post("/owner/users", requireAuth, async (req, res) => {
  try {
    const { email, contactPersonName, role, password } = req.body;
    
    if (!email || !contactPersonName || !role || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    
    // Get current owner information to copy company details
    const owner = await storage.getRestaurantOwnerById(req.ownerId!);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }
    
    // Check if user with this email already exists
    const existingOwner = await storage.getRestaurantOwnerByEmail(email);
    if (existingOwner) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    
    // Hash password
    const { hashPassword } = await import('./auth.js');
    const hashedPassword = await hashPassword(password);
    
    // Create new user with same company details but different role
    const newUserData = {
      companyName: owner.companyName,
      email,
      contactPersonName,
      companyPhone: owner.companyPhone,
      companyAddress: owner.companyAddress,
      passwordHash: hashedPassword,
      password: hashedPassword,
      contactPersonTitle: role,
      contactPersonPhone: '',
      contactPersonEmail: email,
      businessRegistrationNumber: owner.businessRegistrationNumber,
      taxId: owner.taxId,
      companyWebsite: owner.companyWebsite,
      bankName: owner.bankName,
      bankAccountNumber: owner.bankAccountNumber,
      bankRoutingNumber: owner.bankRoutingNumber,
      bankAccountHolderName: owner.bankAccountHolderName,
      iban: owner.iban,
      swiftCode: owner.swiftCode,
      bankAddress: owner.bankAddress,
      accountType: owner.accountType,
      isVerified: false,
      isActive: true
    };
    
    const newUser = await storage.createRestaurantOwner(newUserData);
    
    // Return user info without password
    const { passwordHash, ...userResponse } = newUser;
    res.status(201).json(userResponse);
  } catch (error: any) {
    console.error("User creation error:", error);
    res.status(400).json({ message: error.message || "Failed to create user" });
  }
});

// Get all users for the company
router.get("/owner/users", requireAuth, async (req, res) => {
  try {
    const owner = await storage.getRestaurantOwnerById(req.ownerId!);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Get all users with the same company name
    const users = await storage.getRestaurantOwnersByCompany(owner.companyName);
    
    // Remove password hashes from response
    const safeUsers = users.map((user: any) => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
    
    res.json(safeUsers);
  } catch (error: any) {
    console.error("Get users error:", error);
    res.status(500).json({ message: error.message || "Failed to get users" });
  }
});

// Create voucher package for restaurant
router.post("/restaurants/:id/packages", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    
    // Verify ownership
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    const ownsRestaurant = restaurants.some(r => r.id === restaurantId);
    
    if (!ownsRestaurant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const packageData = insertVoucherPackageSchema.parse({
      ...req.body,
      restaurantId
    });
    
    const newPackage = await storage.createPackage(packageData);
    res.status(201).json(newPackage);
  } catch (error: any) {
    console.error("Package creation error:", error);
    res.status(400).json({ message: error.message || "Failed to create package" });
  }
});

// Update voucher package for restaurant
router.put("/packages/:id", requireAuth, async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    
    // Get the package to verify ownership
    const pkg = await storage.getPackageById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    // Verify ownership through restaurant
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    const ownsRestaurant = restaurants.some(r => r.id === pkg.restaurantId);
    
    if (!ownsRestaurant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const packageData = insertVoucherPackageSchema.partial().parse(req.body);
    const updatedPackage = await storage.updatePackage(packageId, packageData);
    
    if (!updatedPackage) {
      return res.status(404).json({ message: "Package not found" });
    }
    
    res.json(updatedPackage);
  } catch (error: any) {
    console.error("Package update error:", error);
    res.status(400).json({ message: error.message || "Failed to update package" });
  }
});

// Create menu item for restaurant
router.post("/restaurants/:id/menu", requireAuth, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.id);
    
    // Verify ownership
    const restaurants = await storage.getRestaurantsByOwner(req.ownerId!);
    const ownsRestaurant = restaurants.some(r => r.id === restaurantId);
    
    if (!ownsRestaurant) {
      return res.status(403).json({ message: "Access denied" });
    }

    const menuItemData = insertMenuItemSchema.parse({
      ...req.body,
      restaurantId
    });
    
    const newMenuItem = await storage.createMenuItem(menuItemData);
    res.status(201).json(newMenuItem);
  } catch (error: any) {
    console.error("Menu item creation error:", error);
    res.status(400).json({ message: error.message || "Failed to create menu item" });
  }
});

// AI suggest menu item details based on dish name
router.post("/menu-items/ai-suggest", requireAuth, async (req: any, res) => {
  try {
    const { name, category } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Dish name is required" });
    }

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a culinary expert. Given a dish name and optionally its category, provide realistic details about the dish. Respond ONLY with valid JSON in this exact format:
{
  "ingredients": ["ingredient1", "ingredient2", ...],
  "allergens": ["allergen1", ...],
  "dietaryTags": ["tag1", ...],
  "calories": number,
  "preparationTime": number,
  "spiceLevel": number,
  "description": "brief description"
}

Rules:
- ingredients: list the main ingredients used in the dish
- allergens: only include relevant food allergens (e.g., gluten, dairy, nuts, eggs, soy, shellfish, fish, sesame)
- dietaryTags: only include applicable tags from: vegetarian, vegan, gluten-free, dairy-free, nut-free, keto, paleo, halal, kosher, low-carb, high-protein
- calories: estimated calories per serving (reasonable number)
- preparationTime: estimated prep time in minutes
- spiceLevel: 0-5 scale (0=not spicy, 5=extremely spicy)
- description: a brief appetizing description (1-2 sentences)`
        },
        {
          role: "user",
          content: `Dish name: "${name}"${category ? `, Category: "${category}"` : ''}`
        }
      ],
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ message: "AI did not return a response" });
    }

    let suggestion;
    try {
      suggestion = JSON.parse(content);
    } catch {
      return res.status(500).json({ message: "AI returned an invalid response, please try again" });
    }
    res.json(suggestion);
  } catch (error: any) {
    console.error("AI suggest error:", error?.message || error);
    res.status(500).json({ message: error?.message || "Failed to get AI suggestions" });
  }
});

// AI generate food image
router.post("/menu-items/ai-generate-image", requireAuth, async (req: any, res) => {
  try {
    const { name, category } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Dish name is required" });
    }

    const { generateImageBuffer } = await import("./replit_integrations/image/client");
    const { ObjectStorageService } = await import("./objectStorage");

    const prompt = `Professional food photography of "${name}"${category ? ` (${category})` : ''}, beautifully plated on a restaurant dish, top-down view, warm natural lighting, appetizing presentation, clean background, high quality food photography style`;
    
    const imageBuffer = await generateImageBuffer(prompt, "1024x1024");
    
    const objectStorageService = new ObjectStorageService();
    const { uploadUrl, objectPath } = await objectStorageService.getSignedUploadUrl(`${name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-ai.png`, "image/png");
    
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: imageBuffer,
      headers: { "Content-Type": "image/png" }
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload AI-generated image to storage");
    }
    
    res.json({ objectPath });
  } catch (error: any) {
    console.error("AI image generation error:", error?.message || error);
    res.status(500).json({ message: error?.message || "Failed to generate image" });
  }
});

// GET all menu items for owner's restaurants (including unavailable)
router.get("/menu-items", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const ownerRestaurants = await storage.getRestaurantsByOwner(ownerId);
    const restaurantIds = ownerRestaurants.map(r => r.id);
    
    if (restaurantIds.length === 0) {
      return res.json([]);
    }
    
    const items = await db.select()
      .from(menuItems)
      .where(inArray(menuItems.restaurantId, restaurantIds))
      .orderBy(menuItems.category, menuItems.name);
    
    res.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ message: "Failed to fetch menu items" });
  }
});

// PUT update menu item
router.put("/menu-items/:id", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const itemId = parseInt(req.params.id);
    
    const item = await storage.getMenuItemById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    const ownerRestaurants = await storage.getRestaurantsByOwner(ownerId);
    if (!ownerRestaurants.some(r => r.id === item.restaurantId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const allowedFields = ['name', 'description', 'category', 'price', 'imageUrl', 'ingredients', 'allergens', 'dietaryTags', 'spiceLevel', 'isAvailable', 'calories', 'preparationTime', 'isPopular'];
    const updates: any = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    const updated = await storage.updateMenuItem(itemId, updates);
    res.json(updated);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ message: "Failed to update menu item" });
  }
});

// DELETE menu item
router.delete("/menu-items/:id", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const itemId = parseInt(req.params.id);
    
    const item = await storage.getMenuItemById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    const ownerRestaurants = await storage.getRestaurantsByOwner(ownerId);
    if (!ownerRestaurants.some(r => r.id === item.restaurantId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    await storage.deleteMenuItem(itemId);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "Failed to delete menu item" });
  }
});

// PATCH toggle availability
router.patch("/menu-items/:id/availability", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const itemId = parseInt(req.params.id);
    
    const item = await storage.getMenuItemById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    const ownerRestaurants = await storage.getRestaurantsByOwner(ownerId);
    if (!ownerRestaurants.some(r => r.id === item.restaurantId)) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const updated = await storage.updateMenuItem(itemId, { isAvailable: !item.isAvailable });
    res.json(updated);
  } catch (error) {
    console.error("Error toggling availability:", error);
    res.status(500).json({ message: "Failed to toggle availability" });
  }
});

// Update restaurant owner banking information
router.put("/owner/banking", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const bankingData = req.body;
    
    // Validate banking information
    const allowedFields = [
      'bankName', 
      'bankAccountNumber', 
      'bankRoutingNumber', 
      'bankAccountHolderName', 
      'iban', 
      'swiftCode', 
      'bankAddress', 
      'accountType'
    ];
    
    const updates: any = {};
    for (const field of allowedFields) {
      if (bankingData[field] !== undefined) {
        updates[field] = bankingData[field];
      }
    }
    
    const updatedOwner = await storage.updateRestaurantOwner(ownerId, updates);
    
    if (!updatedOwner) {
      return res.status(404).json({ message: "Restaurant owner not found" });
    }
    
    // Return updated banking information (without sensitive data)
    const bankingInfo = {
      bankName: updatedOwner.bankName,
      bankAccountHolderName: updatedOwner.bankAccountHolderName,
      iban: updatedOwner.iban,
      swiftCode: updatedOwner.swiftCode,
      bankAddress: updatedOwner.bankAddress,
      accountType: updatedOwner.accountType
    };
    
    res.json({ 
      message: "Banking information updated successfully",
      bankingInfo 
    });
  } catch (error: any) {
    console.error("Banking update error:", error);
    res.status(400).json({ message: error.message || "Failed to update banking information" });
  }
});

// Get restaurant owner profile (including banking info)
router.get("/owner/profile", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const owner = await storage.getRestaurantOwnerById(ownerId);
    
    if (!owner) {
      return res.status(404).json({ message: "Restaurant owner not found" });
    }
    
    // Return profile without password hash but with banking info
    const { passwordHash, ...profile } = owner;
    res.json(profile);
  } catch (error: any) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Get all users for restaurant owner
router.get("/owner/users", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const users = await storage.getRestaurantOwnerUsers(ownerId);
    res.json(users);
  } catch (error: any) {
    console.error("Users fetch error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Add new user for restaurant owner
router.post("/owner/users", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const { email, contactPersonName, role, password } = req.body;
    
    if (!email || !contactPersonName || !password) {
      return res.status(400).json({ message: "Email, contact person name, and password are required" });
    }
    
    // Hash password before storing
    const { hashPassword } = await import('./auth.js');
    const hashedPassword = await hashPassword(password);
    
    const userData = {
      email,
      contactPersonName,
      role: role || 'user',
      passwordHash: hashedPassword,
      companyName: '',
      companyPhone: '',
      companyAddress: '',
      contactPersonTitle: '',
      contactPersonPhone: '',
      contactPersonEmail: email,
      businessRegistrationNumber: '',
      taxId: '',
      website: '',
      bankName: '',
      bankAccountNumber: '',
      bankRoutingNumber: '',
      bankAccountHolderName: '',
      iban: '',
      swiftCode: '',
      bankAddress: '',
      accountType: '',
      isVerified: false,
      isActive: true
    };
    
    const newUser = await storage.createRestaurantOwner(userData);
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    console.error("User creation error:", error);
    res.status(400).json({ message: error.message || "Failed to create user" });
  }
});

// Delete user for restaurant owner
router.delete("/owner/users/:userId", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const userId = parseInt(req.params.userId);
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    // For now, we'll allow deletion of any user - in production you might want to add ownership verification
    await storage.deleteRestaurantOwner(userId);
    res.json({ message: "User deleted successfully" });
  } catch (error: any) {
    console.error("User deletion error:", error);
    res.status(400).json({ message: error.message || "Failed to delete user" });
  }
});

// ============================================
// CHEF MANAGEMENT (Restaurant Portal - Max 3 per restaurant)
// ============================================

router.get("/restaurants/:restaurantId/chefs", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const restaurantId = parseInt(req.params.restaurantId);

    const restaurant = await storage.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      return res.status(403).json({ message: "Not authorized to access this restaurant" });
    }

    const chefs = await db
      .select()
      .from(chefProfiles)
      .where(eq(chefProfiles.restaurantId, restaurantId))
      .orderBy(desc(chefProfiles.createdAt));

    res.json(chefs);
  } catch (error: any) {
    console.error("Error fetching chefs:", error);
    res.status(500).json({ message: "Failed to fetch chefs" });
  }
});

router.get("/restaurants/:restaurantId/chefs/:chefId", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const restaurantId = parseInt(req.params.restaurantId);
    const chefId = parseInt(req.params.chefId);

    const restaurant = await storage.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      return res.status(403).json({ message: "Not authorized to access this restaurant" });
    }

    const [chef] = await db
      .select()
      .from(chefProfiles)
      .where(and(
        eq(chefProfiles.id, chefId),
        eq(chefProfiles.restaurantId, restaurantId)
      ));

    if (!chef) {
      return res.status(404).json({ message: "Chef not found" });
    }

    const signatureDishes = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.signatureChefId, chefId));

    res.json({ chef, signatureDishes });
  } catch (error: any) {
    console.error("Error fetching chef:", error);
    res.status(500).json({ message: "Failed to fetch chef" });
  }
});

router.post("/restaurants/:restaurantId/chefs", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const restaurantId = parseInt(req.params.restaurantId);

    const restaurant = await storage.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      return res.status(403).json({ message: "Not authorized to access this restaurant" });
    }

    const existingChefs = await db
      .select()
      .from(chefProfiles)
      .where(eq(chefProfiles.restaurantId, restaurantId));

    if (existingChefs.length >= 3) {
      return res.status(400).json({ message: "Maximum 3 chefs per restaurant allowed" });
    }

    const { chefName, title, bio, profileImage, coverImage, specialties, cuisineExpertise, cookingStyles, experienceLevel, yearsOfExperience, certifications, website, instagram, youtube, tiktok, facebook, isPublic } = req.body;

    if (!chefName) {
      return res.status(400).json({ message: "Chef name is required" });
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
        isFeatured: false,
      })
      .returning();

    res.status(201).json(chef);
  } catch (error: any) {
    console.error("Error creating chef:", error);
    res.status(500).json({ message: "Failed to create chef" });
  }
});

router.put("/restaurants/:restaurantId/chefs/:chefId", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const restaurantId = parseInt(req.params.restaurantId);
    const chefId = parseInt(req.params.chefId);

    const restaurant = await storage.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      return res.status(403).json({ message: "Not authorized to access this restaurant" });
    }

    const [existing] = await db
      .select()
      .from(chefProfiles)
      .where(and(
        eq(chefProfiles.id, chefId),
        eq(chefProfiles.restaurantId, restaurantId)
      ));

    if (!existing) {
      return res.status(404).json({ message: "Chef not found" });
    }

    const updateData: any = { updatedAt: new Date() };
    const fields = ['chefName', 'title', 'bio', 'profileImage', 'coverImage', 'specialties', 'cuisineExpertise', 'cookingStyles', 'experienceLevel', 'yearsOfExperience', 'certifications', 'website', 'instagram', 'youtube', 'tiktok', 'facebook', 'isPublic'];

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

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating chef:", error);
    res.status(500).json({ message: "Failed to update chef" });
  }
});

router.delete("/restaurants/:restaurantId/chefs/:chefId", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const restaurantId = parseInt(req.params.restaurantId);
    const chefId = parseInt(req.params.chefId);

    const restaurant = await storage.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      return res.status(403).json({ message: "Not authorized to access this restaurant" });
    }

    const [existing] = await db
      .select()
      .from(chefProfiles)
      .where(and(
        eq(chefProfiles.id, chefId),
        eq(chefProfiles.restaurantId, restaurantId)
      ));

    if (!existing) {
      return res.status(404).json({ message: "Chef not found" });
    }

    await db.update(menuItems).set({ signatureChefId: null }).where(eq(menuItems.signatureChefId, chefId));
    await db.delete(chefProfiles).where(eq(chefProfiles.id, chefId));

    res.json({ message: "Chef deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting chef:", error);
    res.status(500).json({ message: "Failed to delete chef" });
  }
});

router.patch("/restaurants/:restaurantId/menu-items/:menuItemId/signature-chef", requireAuth, async (req, res) => {
  try {
    const ownerId = req.ownerId!;
    const restaurantId = parseInt(req.params.restaurantId);
    const menuItemId = parseInt(req.params.menuItemId);
    const { signatureChefId } = req.body;

    const restaurant = await storage.getRestaurantById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      return res.status(403).json({ message: "Not authorized to access this restaurant" });
    }

    if (signatureChefId) {
      const [chef] = await db
        .select()
        .from(chefProfiles)
        .where(and(
          eq(chefProfiles.id, signatureChefId),
          eq(chefProfiles.restaurantId, restaurantId)
        ));

      if (!chef) {
        return res.status(400).json({ message: "Chef not found or not from this restaurant" });
      }
    }

    const [updated] = await db
      .update(menuItems)
      .set({ signatureChefId: signatureChefId || null })
      .where(and(
        eq(menuItems.id, menuItemId),
        eq(menuItems.restaurantId, restaurantId)
      ))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.json(updated);
  } catch (error: any) {
    console.error("Error updating menu item signature chef:", error);
    res.status(500).json({ message: "Failed to update menu item" });
  }
});

// GET /api/restaurant-portal/chefs - Get chefs for owner's restaurants
router.get("/chefs", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const ownerRestaurants = await db.select({ id: restaurants.id }).from(restaurants).where(eq(restaurants.ownerId, ownerId));
    const restaurantIds = ownerRestaurants.map(r => r.id);
    
    if (restaurantIds.length === 0) {
      return res.json([]);
    }
    
    const chefs = await db
      .select({ chef: chefProfiles, restaurant: { id: restaurants.id, name: restaurants.name } })
      .from(chefProfiles)
      .leftJoin(restaurants, eq(chefProfiles.restaurantId, restaurants.id))
      .where(inArray(chefProfiles.restaurantId, restaurantIds))
      .orderBy(desc(chefProfiles.createdAt));
    
    res.json(chefs);
  } catch (error) {
    console.error("Error fetching restaurant chefs:", error);
    res.status(500).json({ message: "Failed to fetch chefs" });
  }
});

// POST /api/restaurant-portal/chefs - Create chef for owner's restaurant
router.post("/chefs", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const { restaurantId, ...chefData } = req.body;
    
    if (!restaurantId || !chefData.chefName) {
      return res.status(400).json({ message: "Restaurant and chef name are required" });
    }
    
    const [restaurant] = await db.select().from(restaurants).where(and(eq(restaurants.id, restaurantId), eq(restaurants.ownerId, ownerId)));
    if (!restaurant) {
      return res.status(403).json({ message: "Restaurant not found or not owned by you" });
    }
    
    const [chef] = await db.insert(chefProfiles).values({
      restaurantId,
      chefName: chefData.chefName,
      title: chefData.title || null,
      bio: chefData.bio || null,
      profileImage: chefData.profileImage || null,
      coverImage: chefData.coverImage || null,
      specialties: chefData.specialties || [],
      cuisineExpertise: chefData.cuisineExpertise || [],
      cookingStyles: chefData.cookingStyles || [],
      experienceLevel: chefData.experienceLevel || 'professional',
      yearsOfExperience: chefData.yearsOfExperience || 0,
      certifications: chefData.certifications || [],
      website: chefData.website || null,
      instagram: chefData.instagram || null,
      youtube: chefData.youtube || null,
      tiktok: chefData.tiktok || null,
      facebook: chefData.facebook || null,
      isPublic: chefData.isPublic !== false,
      isFeatured: false,
    }).returning();
    
    res.status(201).json(chef);
  } catch (error) {
    console.error("Error creating chef:", error);
    res.status(500).json({ message: "Failed to create chef" });
  }
});

// PUT /api/restaurant-portal/chefs/:id - Update chef
router.put("/chefs/:id", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const chefId = parseInt(req.params.id);
    
    const [existing] = await db.select().from(chefProfiles).where(eq(chefProfiles.id, chefId));
    if (!existing) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    const [restaurant] = await db.select().from(restaurants).where(and(eq(restaurants.id, existing.restaurantId), eq(restaurants.ownerId, ownerId)));
    if (!restaurant) {
      return res.status(403).json({ message: "Not authorized to edit this chef" });
    }
    
    const updateData: any = { updatedAt: new Date() };
    const allowedFields = ['chefName', 'title', 'bio', 'profileImage', 'coverImage', 'specialties', 'cuisineExpertise', 'cookingStyles', 'experienceLevel', 'yearsOfExperience', 'certifications', 'website', 'instagram', 'youtube', 'tiktok', 'facebook', 'isPublic'];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    const [updated] = await db.update(chefProfiles).set(updateData).where(eq(chefProfiles.id, chefId)).returning();
    res.json(updated);
  } catch (error) {
    console.error("Error updating chef:", error);
    res.status(500).json({ message: "Failed to update chef" });
  }
});

// DELETE /api/restaurant-portal/chefs/:id - Delete chef
router.delete("/chefs/:id", requireAuth, async (req: any, res) => {
  try {
    const ownerId = req.ownerId!;
    const chefId = parseInt(req.params.id);
    
    const [existing] = await db.select().from(chefProfiles).where(eq(chefProfiles.id, chefId));
    if (!existing) {
      return res.status(404).json({ message: "Chef not found" });
    }
    
    const [restaurant] = await db.select().from(restaurants).where(and(eq(restaurants.id, existing.restaurantId), eq(restaurants.ownerId, ownerId)));
    if (!restaurant) {
      return res.status(403).json({ message: "Not authorized to delete this chef" });
    }
    
    await db.update(menuItems).set({ signatureChefId: null }).where(eq(menuItems.signatureChefId, chefId));
    await db.delete(chefProfiles).where(eq(chefProfiles.id, chefId));
    
    res.json({ message: "Chef deleted successfully" });
  } catch (error) {
    console.error("Error deleting chef:", error);
    res.status(500).json({ message: "Failed to delete chef" });
  }
});

export default router;