import { Express, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { sendVerificationEmail } from './emailService';
import { sendVerificationSMS } from './smsService';

// Hash password function
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, {
  emailCode: string;
  smsCode: string;
  userData: any;
  expiresAt: Date;
}>();

// Generate 6-digit verification code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send email verification using SendGrid
async function sendEmailVerification(email: string, code: string, firstName: string): Promise<boolean> {
  return await sendVerificationEmail(email, code, firstName);
}

// Send SMS verification using dedicated SMS service
async function sendSMSVerification(phone: string, code: string): Promise<boolean> {
  return await sendVerificationSMS(phone, code);
}

export function registerUserAuthRoutes(app: Express) {
  // User registration endpoint
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, phone, password } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Validate phone format
      const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Invalid phone number format' });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Check if user already exists by email
      const existingUser = await storage.getCustomerByEmail(email);
      
      if (existingUser) {
        return res.status(409).json({ 
          message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
        });
      }

      // Generate verification codes
      const emailCode = generateVerificationCode();
      const smsCode = generateVerificationCode();
      
      // Hash password
      const passwordHash = await hashPassword(password);

      // Store verification data temporarily
      const verificationKey = `${email}_${phone}`;
      verificationCodes.set(verificationKey, {
        emailCode,
        smsCode,
        userData: {
          firstName,
          lastName,
          email,
          phone,
          passwordHash
        },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      // Send verification codes
      await Promise.all([
        sendEmailVerification(email, emailCode, firstName),
        sendSMSVerification(phone, smsCode)
      ]);

      res.json({ 
        message: 'Verification codes sent successfully',
        email,
        phone
      });
    } catch (error) {
      console.error('Registration error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ message: 'Registration failed', error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Resend verification codes
  app.post('/api/auth/resend-verification', async (req: Request, res: Response) => {
    try {
      const { email, phone, type } = req.body;

      if (!email || !phone || !type) {
        return res.status(400).json({ message: 'Email, phone, and type are required' });
      }

      const verificationKey = `${email}_${phone}`;
      const verificationData = verificationCodes.get(verificationKey);

      if (!verificationData) {
        return res.status(404).json({ message: 'No pending verification found' });
      }

      if (verificationData.expiresAt < new Date()) {
        verificationCodes.delete(verificationKey);
        return res.status(410).json({ message: 'Verification session expired. Please register again.' });
      }

      // Generate new code for the requested type
      let newCode: string;
      if (type === 'email') {
        newCode = generateVerificationCode();
        verificationData.emailCode = newCode;
        await sendEmailVerification(email, newCode, verificationData.userData.firstName);
      } else if (type === 'sms') {
        newCode = generateVerificationCode();
        verificationData.smsCode = newCode;
        await sendSMSVerification(phone, newCode);
      } else {
        return res.status(400).json({ message: 'Invalid type. Must be "email" or "sms"' });
      }

      // Update expiration time
      verificationData.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      verificationCodes.set(verificationKey, verificationData);

      res.json({ message: `${type} verification code resent successfully` });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification code' });
    }
  });

  // Verify codes and create user
  app.post('/api/auth/verify', async (req: Request, res: Response) => {
    try {
      const { email, phone, emailCode, smsCode } = req.body;

      if (!email || !phone || !emailCode || !smsCode) {
        return res.status(400).json({ message: 'All verification codes are required' });
      }

      const verificationKey = `${email}_${phone}`;
      const verificationData = verificationCodes.get(verificationKey);

      if (!verificationData) {
        return res.status(404).json({ message: 'No pending verification found' });
      }

      if (verificationData.expiresAt < new Date()) {
        verificationCodes.delete(verificationKey);
        return res.status(410).json({ message: 'Verification codes expired. Please register again.' });
      }

      // Verify codes
      if (verificationData.emailCode !== emailCode || verificationData.smsCode !== smsCode) {
        return res.status(400).json({ message: 'Invalid verification codes' });
      }

      // Create customer account with password hash
      const customer = await storage.createCustomer({
        name: `${verificationData.userData.firstName} ${verificationData.userData.lastName}`,
        email: verificationData.userData.email,
        phone: verificationData.userData.phone,
        passwordHash: verificationData.userData.passwordHash,
        balance: "0.00",
        loyaltyPoints: 0,
        totalPointsEarned: 0,
        membershipTier: "Bronze",
        age: null,
        weight: null,
        height: null,
        activityLevel: null,
        healthGoal: null,
        dietaryPreferences: [],
        allergies: [],
        dislikes: [],
        healthConditions: []
      });

      // Clean up verification data
      verificationCodes.delete(verificationKey);

      // Create session (simple session management for demo)
      if (req.session) {
        req.session.ownerId = customer.id;
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
          }
        });
      }

      res.json({ 
        message: 'Account created and verified successfully',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          membershipTier: customer.membershipTier,
          loyaltyPoints: customer.loyaltyPoints
        }
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ message: 'Verification failed' });
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password, mobile } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find customer by email
      const customer = await storage.getCustomerByEmail(email);

      if (!customer) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      if (customer.passwordHash) {
        const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
        if (!isValidPassword) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }
      } else {
        return res.status(401).json({ message: 'Account requires password setup. Please register again.' });
      }

      // Create session for web
      if (req.session) {
        req.session.ownerId = customer.id;
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
          }
        });
      }

      // For mobile apps, also generate a mobile session token
      let sessionToken: string | undefined;
      if (mobile) {
        const { generateMobileSessionToken } = await import('./multiAuth');
        const user = {
          id: `customer_${customer.id}`,
          email: customer.email,
          firstName: customer.name?.split(' ')[0] || '',
          lastName: customer.name?.split(' ').slice(1).join(' ') || '',
          customerId: customer.id,
        };
        sessionToken = await generateMobileSessionToken(user);
        console.log('[Login] Mobile session token generated for customer:', customer.id);
      }

      res.json({
        message: 'Login successful',
        sessionToken, // Only present for mobile requests
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          membershipTier: customer.membershipTier,
          loyaltyPoints: customer.loyaltyPoints
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Demo login endpoint for testing voucher functionality
  app.post('/api/auth/demo-login', async (req: Request, res: Response) => {
    try {
      // Login as the demo user (customer ID 14) who has vouchers
      const customer = await storage.getCustomerById(14);

      if (!customer) {
        return res.status(404).json({ message: 'Demo user not found' });
      }

      // Create session
      if (req.session) {
        req.session.ownerId = customer.id;
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
          }
        });
      }

      res.json({
        message: 'Demo login successful',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          membershipTier: customer.membershipTier,
          loyaltyPoints: customer.loyaltyPoints
        }
      });
    } catch (error) {
      console.error('Demo login error:', error);
      res.status(500).json({ message: 'Demo login failed' });
    }
  });

  // Logout endpoints (both GET and POST for compatibility)
  const logoutHandler = (req: Request, res: Response) => {
    if (req.session) {
      // Clear session data immediately for faster response
      req.session.ownerId = undefined;
      
      // Clear cookie immediately
      res.clearCookie('eatoff.sid');
      
      // Send response first, then destroy session in background
      res.json({ message: 'Logout successful' });
      
      // Destroy session asynchronously without blocking response
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error (background):', err);
        }
      });
    } else {
      res.json({ message: 'Already logged out' });
    }
  };
  
  app.post('/api/auth/logout', logoutHandler);
  app.get('/api/auth/logout', logoutHandler);

  // Get current user endpoint
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      // Check for mobile user (set by Authorization header middleware)
      const mobileUser = (req as any).mobileUser || (req as any).user;
      if (mobileUser && mobileUser.id && typeof mobileUser.id === 'string') {
        // Handle OAuth users (google_xxx)
        if (mobileUser.id.startsWith('google_')) {
          console.log('[Auth User] Mobile OAuth user:', mobileUser.id);
          return res.json({
            id: mobileUser.id,
            customerId: mobileUser.id,
            name: `${mobileUser.firstName || ''} ${mobileUser.lastName || ''}`.trim() || 'User',
            email: mobileUser.email,
            phone: null,
            membershipTier: 'bronze',
            loyaltyPoints: 0,
            balance: '0',
            customerCode: null,
            isOAuthUser: true
          });
        }
        
        // Handle email/password customers (customer_xxx)
        if (mobileUser.id.startsWith('customer_')) {
          const customerId = parseInt(mobileUser.id.replace('customer_', ''), 10);
          console.log('[Auth User] Mobile customer user:', customerId);
          const customer = await storage.getCustomer(customerId);
          if (customer) {
            return res.json({
              id: customer.id,
              customerId: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              membershipTier: customer.membershipTier,
              loyaltyPoints: customer.loyaltyPoints,
              balance: customer.balance,
              customerCode: customer.customerCode,
              dietaryPreferences: customer.dietaryPreferences,
              allergies: customer.allergies
            });
          }
        }
      }
      
      if (!req.session?.ownerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const customer = await storage.getCustomer(req.session.ownerId);

      if (!customer) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Debug: Log customer data including customerCode
      console.log('Auth user data:', {
        id: customer.id,
        customerCode: customer.customerCode,
        hasCustomerCode: !!customer.customerCode
      });

      res.json({
        id: customer.id,
        customerId: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        membershipTier: customer.membershipTier,
        loyaltyPoints: customer.loyaltyPoints,
        balance: customer.balance,
        customerCode: customer.customerCode,
        dietaryPreferences: customer.dietaryPreferences,
        allergies: customer.allergies
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user data' });
    }
  });

  // Update profile endpoint
  app.patch('/api/auth/profile', async (req: Request, res: Response) => {
    try {
      // Check for mobile user (set by Authorization header middleware)
      const mobileUser = (req as any).mobileUser || (req as any).user;
      let customerId: number | null = null;

      if (mobileUser && mobileUser.id && typeof mobileUser.id === 'string') {
        if (mobileUser.id.startsWith('customer_')) {
          customerId = parseInt(mobileUser.id.replace('customer_', ''), 10);
        }
      } else if (req.session?.ownerId) {
        customerId = req.session.ownerId;
      }

      if (!customerId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { name, phone, dietaryPreferences, allergies } = req.body;
      
      // Update customer in database
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update fields if provided
      const updates: Partial<{ name: string; phone: string; dietaryPreferences: string[]; allergies: string[] }> = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (dietaryPreferences !== undefined) updates.dietaryPreferences = dietaryPreferences;
      if (allergies !== undefined) updates.allergies = allergies;

      if (Object.keys(updates).length > 0) {
        await storage.updateCustomer(customerId, updates);
      }

      const updatedCustomer = await storage.getCustomer(customerId);
      res.json({
        id: updatedCustomer!.id,
        name: updatedCustomer!.name,
        email: updatedCustomer!.email,
        phone: updatedCustomer!.phone,
        membershipTier: updatedCustomer!.membershipTier,
        loyaltyPoints: updatedCustomer!.loyaltyPoints,
        balance: updatedCustomer!.balance,
        customerCode: updatedCustomer!.customerCode,
        dietaryPreferences: updatedCustomer!.dietaryPreferences,
        allergies: updatedCustomer!.allergies
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });
}