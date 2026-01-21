import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { insertTableReservationSchema, insertRestaurantAvailabilitySchema } from "@shared/schema";
import { isAuthenticated } from "./replitAuth";
import { requireAuth } from "./auth";
import { sendSMS } from "./smsService";
import { sendVerificationEmail } from "./emailService";
import { sendReservationStatusNotification, sendReservationNotificationToRestaurant } from "./notificationService";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Restaurant owner authentication middleware
interface RestaurantAuthRequest extends Request {
  ownerId?: number;
}

export function registerReservationRoutes(app: Express) {
  
  // Customer reservation endpoints
  
  // Create a new reservation
  app.post("/api/reservations", async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log("Received reservation request:", req.body);
      const reservationData = insertTableReservationSchema.parse(req.body);
      console.log("Parsed reservation data:", reservationData);
      
      // Check if user is authenticated (optional - allow guest reservations)
      let customerId = null;
      if (req.user?.claims?.sub) {
        customerId = parseInt(req.user.claims.sub);
      }
      console.log("Customer ID:", customerId);
      
      // Basic validation for reservation date
      const reservationDate = new Date(reservationData.reservationDate);
      const now = new Date();
      
      // Check if reservation is in the future
      if (reservationDate <= now) {
        return res.status(400).json({ 
          message: "Reservation must be for a future date and time" 
        });
      }
      
      // Check if reservation is too far in the future (6 months max)
      const sixMonthsFromNow = new Date(now.getTime() + (6 * 30 * 24 * 60 * 60 * 1000));
      if (reservationDate > sixMonthsFromNow) {
        return res.status(400).json({ 
          message: "Reservations can only be made up to 6 months in advance" 
        });
      }
      
      const finalReservationData = {
        ...reservationData,
        customerId,
        status: 'pending'
      };
      console.log("Final reservation data for storage:", finalReservationData);
      
      const reservation = await storage.createReservation(finalReservationData);
      console.log("Created reservation:", reservation);
      
      res.status(201).json(reservation);
    } catch (error: any) {
      console.error("Reservation creation error:", error);
      res.status(400).json({ message: error.message || "Failed to create reservation" });
    }
  });
  
  // Get customer's reservations
  app.get("/api/customers/:customerId/reservations", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customerId = parseInt(req.params.customerId);
      
      // Ensure user can only access their own reservations
      if (req.user?.claims?.sub && parseInt(req.user.claims.sub) !== customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const reservations = await storage.getReservationsByCustomer(customerId);
      res.json(reservations);
    } catch (error: any) {
      console.error("Error fetching customer reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });
  
  // Get single reservation details
  app.get("/api/reservations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reservation = await storage.getReservationById(id);
      
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      res.json(reservation);
    } catch (error: any) {
      console.error("Error fetching reservation:", error);
      res.status(500).json({ message: "Failed to fetch reservation" });
    }
  });
  
  // Cancel reservation (customer)
  app.patch("/api/reservations/:id/cancel", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const reservation = await storage.getReservationById(id);
      
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      // Check if user owns this reservation
      if (req.user?.claims?.sub && reservation.customerId && parseInt(req.user.claims.sub) !== reservation.customerId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedReservation = await storage.updateReservationStatus(
        id, 
        'cancelled', 
        'Cancelled by customer'
      );
      
      res.json(updatedReservation);
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      res.status(500).json({ message: "Failed to cancel reservation" });
    }
  });
  
  // Restaurant owner endpoints
  
  // Get restaurant's reservations
  app.get("/api/restaurant-portal/reservations", requireAuth, async (req: RestaurantAuthRequest, res: Response) => {
    try {
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      // Get restaurants owned by this owner
      const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
      
      if (restaurants.length === 0) {
        return res.json([]);
      }
      
      // Get reservations for all owned restaurants
      const allReservations = [];
      for (const restaurant of restaurants) {
        const reservations = await storage.getReservationsByRestaurant(restaurant.id);
        allReservations.push(...reservations);
      }
      
      // Sort by creation date (newest first)
      allReservations.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt as string | Date).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt as string | Date).getTime() : 0;
        return dateB - dateA;
      });
      
      res.json(allReservations);
    } catch (error: any) {
      console.error("Error fetching restaurant reservations:", error);
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Get restaurant orders for restaurant portal
  app.get("/api/restaurant-portal/orders", requireAuth, async (req: RestaurantAuthRequest, res: Response) => {
    try {
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }

      // Get all orders for restaurants owned by this owner
      const orders = await storage.getRestaurantOrders(req.ownerId);
      
      res.json(orders);
    } catch (error: any) {
      console.error("Error fetching restaurant orders:", error);
      res.status(500).json({ message: "Error fetching orders: " + error.message });
    }
  });
  
  // Confirm reservation (restaurant)
  app.patch("/api/restaurant-portal/reservations/:id/confirm", requireAuth, async (req: RestaurantAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { restaurantNotes } = req.body;
      
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      const reservation = await storage.getReservationById(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      // Verify ownership
      const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
      const ownsRestaurant = restaurants.some(r => r.id === reservation.restaurantId);
      
      if (!ownsRestaurant) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedReservation = await storage.updateReservationStatus(
        id, 
        'confirmed', 
        restaurantNotes,
        req.ownerId
      );
      
      // Send notification to customer
      try {
        const restaurant = restaurants.find(r => r.id === reservation.restaurantId);
        if (restaurant && reservation.customerId) {
          await sendReservationStatusNotification({
            customerId: reservation.customerId,
            customerName: reservation.customerName,
            customerEmail: reservation.customerEmail,
            customerPhone: reservation.customerPhone || undefined,
            reservationId: id,
            restaurantName: restaurant.name,
            reservationDate: new Date(reservation.reservationDate).toLocaleDateString(),
            reservationTime: new Date(reservation.reservationDate).toLocaleTimeString(),
            partySize: reservation.partySize,
            status: 'confirmed'
          });
        }
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
        // Don't fail the request if notification fails
      }
      
      res.json(updatedReservation);
    } catch (error: any) {
      console.error("Error confirming reservation:", error);
      res.status(500).json({ message: "Failed to confirm reservation" });
    }
  });
  
  // Reject reservation (restaurant)
  app.patch("/api/restaurant-portal/reservations/:id/reject", requireAuth, async (req: RestaurantAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { restaurantNotes } = req.body;
      
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      const reservation = await storage.getReservationById(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      
      // Verify ownership
      const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
      const ownsRestaurant = restaurants.some(r => r.id === reservation.restaurantId);
      
      if (!ownsRestaurant) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedReservation = await storage.updateReservationStatus(
        id, 
        'cancelled', 
        restaurantNotes || 'Cancelled by restaurant',
        req.ownerId
      );
      
      // Send notification to customer
      try {
        const restaurant = restaurants.find(r => r.id === reservation.restaurantId);
        if (restaurant && reservation.customerId) {
          await sendReservationStatusNotification({
            customerId: reservation.customerId,
            customerName: reservation.customerName,
            customerEmail: reservation.customerEmail,
            customerPhone: reservation.customerPhone || undefined,
            reservationId: id,
            restaurantName: restaurant.name,
            reservationDate: new Date(reservation.reservationDate).toLocaleDateString(),
            reservationTime: new Date(reservation.reservationDate).toLocaleTimeString(),
            partySize: reservation.partySize,
            status: 'rejected'
          });
        }
      } catch (notificationError) {
        console.error("Failed to send notification:", notificationError);
      }
      
      res.json(updatedReservation);
    } catch (error: any) {
      console.error("Error rejecting reservation:", error);
      res.status(500).json({ message: "Failed to reject reservation" });
    }
  });
  
  // Restaurant availability management
  
  // Get restaurant availability settings
  app.get("/api/restaurant-portal/availability", async (req: RestaurantAuthRequest, res: Response) => {
    try {
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
      
      if (restaurants.length === 0) {
        return res.json([]);
      }
      
      // Get availability for all owned restaurants
      const allAvailability = [];
      for (const restaurant of restaurants) {
        const availability = await storage.getRestaurantAvailability(restaurant.id);
        allAvailability.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          availability
        });
      }
      
      res.json(allAvailability);
    } catch (error: any) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });
  
  // Set restaurant availability
  app.post("/api/restaurant-portal/availability", async (req: RestaurantAuthRequest, res: Response) => {
    try {
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      const availabilityData = insertRestaurantAvailabilitySchema.parse(req.body);
      
      // Verify ownership
      const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
      const ownsRestaurant = restaurants.some(r => r.id === availabilityData.restaurantId);
      
      if (!ownsRestaurant) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const availability = await storage.setRestaurantAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error: any) {
      console.error("Error setting availability:", error);
      res.status(400).json({ message: error.message || "Failed to set availability" });
    }
  });
  
  // Update restaurant availability
  app.put("/api/restaurant-portal/availability/:id", async (req: RestaurantAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      // TODO: Add ownership verification for availability record
      
      const updatedAvailability = await storage.updateRestaurantAvailability(id, updates);
      
      if (!updatedAvailability) {
        return res.status(404).json({ message: "Availability record not found" });
      }
      
      res.json(updatedAvailability);
    } catch (error: any) {
      console.error("Error updating availability:", error);
      res.status(400).json({ message: error.message || "Failed to update availability" });
    }
  });
  
  // Public endpoints for customers to check availability
  
  // Get restaurant availability (public)
  app.get("/api/restaurants/:id/availability", async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const availability = await storage.getRestaurantAvailability(restaurantId);
      res.json(availability);
    } catch (error: any) {
      console.error("Error fetching restaurant availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  // Order management endpoints
  
  // Confirm order (restaurant)
  app.patch("/api/restaurant-portal/orders/:id/confirm", requireAuth, async (req: RestaurantAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { restaurantNotes } = req.body;
      
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify ownership
      const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
      const ownsRestaurant = restaurants.some(r => r.id === order.restaurantId);
      
      if (!ownsRestaurant) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(
        id, 
        'confirmed', 
        restaurantNotes
      );
      
      // In production, you would send notification to customer here
      console.log(`Order ${id} confirmed by restaurant`);
      
      res.json(updatedOrder);
    } catch (error: any) {
      console.error("Error confirming order:", error);
      res.status(500).json({ message: "Failed to confirm order" });
    }
  });
  
  // Reject order (restaurant)
  app.patch("/api/restaurant-portal/orders/:id/reject", requireAuth, async (req: RestaurantAuthRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { restaurantNotes } = req.body;
      
      if (!req.ownerId) {
        return res.status(401).json({ message: "Restaurant authentication required" });
      }
      
      const order = await storage.getOrderById(id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify ownership
      const restaurants = await storage.getRestaurantsByOwner(req.ownerId);
      const ownsRestaurant = restaurants.some(r => r.id === order.restaurantId);
      
      if (!ownsRestaurant) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedOrder = await storage.updateOrderStatus(
        id, 
        'cancelled', 
        restaurantNotes || 'Cancelled by restaurant'
      );
      
      // In production, you would send notification to customer here
      console.log(`Order ${id} rejected by restaurant`);
      
      res.json(updatedOrder);
    } catch (error: any) {
      console.error("Error rejecting order:", error);
      res.status(500).json({ message: "Failed to reject order" });
    }
  });
}