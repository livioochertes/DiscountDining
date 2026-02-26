import { Router, Request, Response } from "express";
import { db } from "./db";
import { nanoid } from "nanoid";
import { eq, and, or, desc } from "drizzle-orm";
import { giftVouchers, customers, customerWallets, restaurants, menuItems, purchasedVouchers } from "@shared/schema";
import { sendGiftVoucherEmail } from "./emailService";

const router = Router();

const getAuthCustomerId = async (req: Request): Promise<number | null> => {
  const mobileUser = (req as any).mobileUser;
  const user = (req as any).user;
  const authUser = mobileUser || user;
  if (!authUser) return null;
  if (typeof authUser.customerId === 'number') return authUser.customerId;
  if (typeof authUser.id === 'number') return authUser.id;
  if (authUser.email && typeof authUser.id === 'string') {
    const [customer] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, authUser.email)).limit(1);
    return customer?.id || null;
  }
  return null;
};

const isGiftRecipient = async (gift: any, customerId: number): Promise<boolean> => {
  if (gift.recipientCustomerId === customerId) return true;
  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
  if (customer?.email && gift.recipientEmail === customer.email) return true;
  if (customer?.phone && gift.recipientPhone === customer.phone) return true;
  return false;
};

const VALID_GIFT_TYPES = ['value', 'product'] as const;
const MAX_GIFT_AMOUNT = 50000;

router.post("/gifts/send", async (req: Request, res: Response) => {
  try {
    const senderId = await getAuthCustomerId(req);
    if (!senderId) return res.status(401).json({ message: "Autentificare necesară" });

    const { giftType, amount, recipientEmail, recipientPhone, restaurantId, menuItemId, message } = req.body;

    if (!giftType || !VALID_GIFT_TYPES.includes(giftType)) {
      return res.status(400).json({ message: "Tipul cadoului este invalid" });
    }
    if (!amount) {
      return res.status(400).json({ message: "Suma este obligatorie" });
    }
    if (!recipientEmail && !recipientPhone) {
      return res.status(400).json({ message: "Email-ul sau telefonul destinatarului este obligatoriu" });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > MAX_GIFT_AMOUNT) {
      return res.status(400).json({ message: `Suma invalidă. Maxim ${MAX_GIFT_AMOUNT} RON.` });
    }

    const [sender] = await db.select().from(customers).where(eq(customers.id, senderId));
    if (!sender) return res.status(404).json({ message: "Contul expeditorului nu a fost găsit" });

    const [wallet] = await db.select().from(customerWallets).where(eq(customerWallets.customerId, senderId));
    const walletBalance = parseFloat(wallet?.cashBalance || '0');

    if (walletBalance < parsedAmount) {
      return res.status(400).json({ message: `Fonduri insuficiente. Sold disponibil: ${walletBalance.toFixed(2)} RON` });
    }

    let menuItemName: string | null = null;
    let restaurantName: string | null = null;

    if (giftType === 'product') {
      if (!restaurantId || !menuItemId) {
        return res.status(400).json({ message: "Restaurantul și produsul sunt obligatorii pentru cadou produs" });
      }
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, parseInt(restaurantId)));
      if (!restaurant) return res.status(404).json({ message: "Restaurant negăsit" });
      restaurantName = restaurant.name;

      const [item] = await db.select().from(menuItems).where(
        and(eq(menuItems.id, parseInt(menuItemId)), eq(menuItems.restaurantId, parseInt(restaurantId)))
      );
      if (!item) return res.status(404).json({ message: "Produs negăsit la acest restaurant" });
      menuItemName = item.name;
    }

    let recipientCustomerId: number | null = null;
    if (recipientEmail) {
      const [recipient] = await db.select({ id: customers.id }).from(customers).where(eq(customers.email, recipientEmail.trim().toLowerCase()));
      if (recipient) recipientCustomerId = recipient.id;
    }
    if (!recipientCustomerId && recipientPhone) {
      const [recipient] = await db.select({ id: customers.id }).from(customers).where(eq(customers.phone, recipientPhone.trim()));
      if (recipient) recipientCustomerId = recipient.id;
    }

    const redeemCode = `GIFT-${nanoid(10).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const gift = await db.transaction(async (tx) => {
      await tx.update(customerWallets)
        .set({ cashBalance: (walletBalance - parsedAmount).toFixed(2) })
        .where(eq(customerWallets.customerId, senderId));

      const [newGift] = await tx.insert(giftVouchers).values({
        senderId,
        senderName: sender.name || sender.email || 'EatOff User',
        recipientEmail: recipientEmail?.trim().toLowerCase() || null,
        recipientPhone: recipientPhone?.trim() || null,
        recipientCustomerId,
        giftType,
        amount: parsedAmount.toFixed(2),
        currency: 'RON',
        restaurantId: restaurantId ? parseInt(restaurantId) : null,
        menuItemId: menuItemId ? parseInt(menuItemId) : null,
        menuItemName,
        restaurantName,
        message: message || null,
        status: 'pending',
        redeemCode,
        expiresAt,
      }).returning();

      return newGift;
    });

    if (!recipientCustomerId && recipientEmail) {
      console.log(`📧 Attempting to send gift email to non-EatOff user: ${recipientEmail.trim()}`);
      try {
        const emailSent = await sendGiftVoucherEmail({
          recipientEmail: recipientEmail.trim(),
          senderName: sender.name || 'Un prieten',
          giftType,
          amount: parsedAmount,
          currency: 'RON',
          menuItemName: menuItemName || undefined,
          restaurantName: restaurantName || undefined,
          message: message || undefined,
          redeemCode,
        });
        console.log(`📧 Gift email result for ${recipientEmail.trim()}: ${emailSent ? 'SENT' : 'FAILED'}`);
      } catch (emailErr: any) {
        console.error('Failed to send gift email:', emailErr?.response?.body || emailErr?.message || emailErr);
      }
    } else if (recipientCustomerId) {
      console.log(`🔔 Gift notification for existing EatOff user (customerId: ${recipientCustomerId}), no email needed`);
    }

    res.json({
      success: true,
      gift,
      message: recipientCustomerId
        ? 'Cadoul a fost trimis! Destinatarul va primi o notificare în aplicație.'
        : 'Cadoul a fost trimis! Destinatarul va primi un email cu detaliile.',
    });
  } catch (error: any) {
    console.error("Error sending gift:", error);
    res.status(500).json({ message: "Eroare la trimiterea cadoului: " + error.message });
  }
});

router.get("/gifts/received", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) return res.status(401).json({ message: "Autentificare necesară" });

    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));

    const orConditions = [eq(giftVouchers.recipientCustomerId, customerId)];
    if (customer?.email) {
      orConditions.push(eq(giftVouchers.recipientEmail, customer.email));
    }
    if (customer?.phone) {
      orConditions.push(eq(giftVouchers.recipientPhone, customer.phone));
    }

    const gifts = await db.select().from(giftVouchers)
      .where(and(eq(giftVouchers.status, 'pending'), or(...orConditions)))
      .orderBy(desc(giftVouchers.createdAt));

    const now = new Date();
    const validGifts = gifts.filter(g => !g.expiresAt || new Date(g.expiresAt) > now);

    res.json(validGifts);
  } catch (error: any) {
    console.error("Error fetching received gifts:", error);
    res.status(500).json({ message: "Eroare: " + error.message });
  }
});

router.post("/gifts/:id/accept", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) return res.status(401).json({ message: "Autentificare necesară" });

    const giftId = parseInt(req.params.id);
    const [gift] = await db.select().from(giftVouchers).where(eq(giftVouchers.id, giftId));

    if (!gift) return res.status(404).json({ message: "Cadou negăsit" });
    if (gift.status !== 'pending') return res.status(400).json({ message: "Acest cadou a fost deja procesat" });

    const recipientCheck = await isGiftRecipient(gift, customerId);
    if (!recipientCheck) return res.status(403).json({ message: "Nu ești destinatarul acestui cadou" });

    const amount = parseFloat(gift.amount);

    await db.transaction(async (tx) => {
      if (gift.giftType === 'value') {
        const [wallet] = await tx.select().from(customerWallets).where(eq(customerWallets.customerId, customerId));
        if (wallet) {
          const newBalance = parseFloat(wallet.cashBalance || '0') + amount;
          await tx.update(customerWallets)
            .set({ cashBalance: newBalance.toFixed(2) })
            .where(eq(customerWallets.customerId, customerId));
        } else {
          await tx.insert(customerWallets).values({
            customerId,
            cashBalance: amount.toFixed(2),
            loyaltyPoints: 0,
          });
        }
      } else if (gift.giftType === 'product' && gift.restaurantId) {
        await tx.insert(purchasedVouchers).values({
          customerId,
          restaurantId: gift.restaurantId,
          packageId: null as any,
          totalMeals: 1,
          usedMeals: 0,
          purchasePrice: gift.amount,
          status: 'active',
          qrCode: `GIFT-${nanoid(8)}`,
          expiryDate: gift.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      await tx.update(giftVouchers)
        .set({ status: 'accepted', recipientCustomerId: customerId })
        .where(eq(giftVouchers.id, giftId));
    });

    res.json({
      success: true,
      message: gift.giftType === 'value'
        ? `${amount.toFixed(2)} RON au fost adăugați în portofel!`
        : `Voucherul pentru ${gift.menuItemName} a fost adăugat!`,
    });
  } catch (error: any) {
    console.error("Error accepting gift:", error);
    res.status(500).json({ message: "Eroare la acceptarea cadoului: " + error.message });
  }
});

router.post("/gifts/:id/decline", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) return res.status(401).json({ message: "Autentificare necesară" });

    const giftId = parseInt(req.params.id);
    const [gift] = await db.select().from(giftVouchers).where(eq(giftVouchers.id, giftId));

    if (!gift) return res.status(404).json({ message: "Cadou negăsit" });
    if (gift.status !== 'pending') return res.status(400).json({ message: "Acest cadou a fost deja procesat" });

    const recipientCheck = await isGiftRecipient(gift, customerId);
    if (!recipientCheck) return res.status(403).json({ message: "Nu ești destinatarul acestui cadou" });

    const amount = parseFloat(gift.amount);

    await db.transaction(async (tx) => {
      const [senderWallet] = await tx.select().from(customerWallets).where(eq(customerWallets.customerId, gift.senderId));
      if (senderWallet) {
        const refundBalance = parseFloat(senderWallet.cashBalance || '0') + amount;
        await tx.update(customerWallets)
          .set({ cashBalance: refundBalance.toFixed(2) })
          .where(eq(customerWallets.customerId, gift.senderId));
      }

      await tx.update(giftVouchers)
        .set({ status: 'cancelled' })
        .where(eq(giftVouchers.id, giftId));
    });

    res.json({ success: true, message: "Cadoul a fost refuzat. Suma a fost returnată expeditorului." });
  } catch (error: any) {
    console.error("Error declining gift:", error);
    res.status(500).json({ message: "Eroare: " + error.message });
  }
});

router.get("/gifts/sent", async (req: Request, res: Response) => {
  try {
    const customerId = await getAuthCustomerId(req);
    if (!customerId) return res.status(401).json({ message: "Autentificare necesară" });

    const gifts = await db.select().from(giftVouchers)
      .where(eq(giftVouchers.senderId, customerId))
      .orderBy(desc(giftVouchers.createdAt));

    res.json(gifts);
  } catch (error: any) {
    console.error("Error fetching sent gifts:", error);
    res.status(500).json({ message: "Eroare: " + error.message });
  }
});

export { router as giftRoutes };
