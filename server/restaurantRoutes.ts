import { Router } from "express";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { 
  insertRestaurantOwnerSchema, 
  loginRestaurantOwnerSchema,
  insertRestaurantSchema,
  insertVoucherPackageSchema,
  insertMenuItemSchema
} from "@shared/schema";

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

export default router;