# EatOff

## Overview
EatOff is a restaurant voucher platform that allows customers to purchase discounted meal packages with a Pay Later option. It features variable voucher packages, flexible pricing with interest or discounts, QR payment generation, wallet management, and a dedicated restaurant portal. The platform aims to provide a seamless experience for users to discover deals and manage their purchases, while offering restaurants tools to create and manage their offerings. It also includes community features like recipe sharing and an AI-powered support system to enhance user engagement and support.

## User Preferences
- Preferred communication style: Simple, everyday language (Romanian preferred)
- UI Pattern: Inline expandable sections preferred over modals for better UX
- Component Choice: Native HTML select elements over Radix UI portaled components for positioning reliability

## System Architecture

### Core Technologies
The application is a full-stack JavaScript application built with:
- **Frontend**: React 18 with Vite, Tailwind CSS for styling, and shadcn/ui for components.
- **Backend**: Express.js with TypeScript for robust API development.
- **Database**: PostgreSQL managed with Drizzle ORM for type-safe database interactions.
- **Mobile Development**: Capacitor for wrapping the web app into native Android and iOS applications.

### Mobile Application Design
The mobile app features a "Bright Clean" design system with a dual-layout approach for web (desktop) and mobile. Mobile layouts are inspired by Revolut and Glovo, prioritizing a responsive and intuitive user experience.
- **Navigation**: 5-tab bottom navigation for core functionalities (Home, Explore, AI Menu, Wallet, Profile).
- **Mobile Routes**: Dedicated `/m/*` routes for mobile-specific views, with automatic redirection for Capacitor builds.
- **Design System**: White background, gray secondary text, teal/green accent, rounded corners (20-24px), and an 8px grid spacing.

### Key Features
- **Multi-Language System**: Supports 6 languages (en, es, fr, de, it, ro) with auto-detection and persistence.
- **AI Support System**: AI-powered customer support chat widget with RAG-based knowledge base, automatic escalation for critical issues, and multi-language responses.
- **Recipe Sharing System**: Allows users to discover, share, like, save, and comment on recipes. Recipes can be associated with restaurants and include dietary tags and difficulty levels.
- **Cashback & Loyalty System**: Comprehensive system for managing EatOff-wide and restaurant-specific cashback groups, customer credit accounts with an approval flow, and loyalty tiers with automatic upgrades based on spending. QR code scanning auto-enrolls customers in the best matching group.
- **Restaurant Customer Management**: Web portal "Clienți" tab with full enrolled customer list, group filters, search, contact info, and spending stats. Mobile Home tab shows operational alerts (recent orders, reservations, newly enrolled customers).
- **Real-Time Notification System**: Dual-layer notification system: SSE (foreground) + Push (background). Server: `server/sseNotifications.ts` with authenticated SSE endpoint (`GET /api/restaurant/:id/notifications/stream`, requires `requireAuth`), `notifyRestaurant()` function called from reservation/order creation and status change endpoints. `server/pushNotifications.ts` with token registration (`POST /api/push/register`), unregistration (`DELETE /api/push/unregister`), Firebase Admin SDK integration (graceful fallback when not configured), auto-cleanup of invalid tokens. DB: `device_push_tokens` table. Client: `MobileRestaurantDashboard.tsx` connects via `EventSource` for SSE, uses `@capacitor/push-notifications` on native for push token registration and foreground notification handling. Visual: animated alert banners (blue=reservations, orange=orders), Web Audio API notification sounds (reusable AudioContext), tab badges with counts. Sound toggle persisted in localStorage. Push notifications require `FIREBASE_SERVICE_ACCOUNT` env var and `google-services.json` for Android / APNs config for iOS.
- **Smart POS System**: Mobile POS with secure payment request flow. Restaurant scans customer QR → creates payment request → customer approves on phone (can add tip before approving) → POS shows success. Features: numeric keypad, QR customer scanning (supports EATOFF:, PAY:, EO-codes, deep links), loyalty tier display (Bronze/Silver/Gold/Platinum/Black), transaction breakdown with discount/cashback, 120s approval timeout with live polling (3s intervals), animated waiting/success screens, transaction history with filters (today/week/month), and settlement reports with CSV export. Tip selection is customer-side only (5%/10%/15%/custom). Reverse flow (restaurant shows QR) is deprecated.
- **Gift Send System**: Users can send two types of gifts: "Cadou Valoric" (monetary amount usable at any restaurant) and "Cadou Produs" (specific menu item from a restaurant). Amount deducted from sender's wallet. Delivery via in-app notification (if recipient is EatOff user) or SendGrid email (if not). Recipients can accept (adds to wallet/vouchers) or decline (refunds sender). DB transactions ensure atomicity. Schema: `gift_vouchers` table. Routes: `server/giftRoutes.ts` mounted at `/api/gifts`. Frontend: `GiftSendFlow` and `ReceivedGiftCard` components in MobileWallet. Notifications: `usePendingPayments` hook polls `/api/gifts/received`.
- **Marketplace System**: Supports multiple countries and currencies, with dynamic Stripe top-up based on the marketplace's currency.
- **Financial Management System**: Complete admin panel for restaurant commissions, user wallet management, and settlement processing.

### Financial System Architecture
The financial management system provides comprehensive control over platform economics:

**Commission Management**
- Default commission rate: 6% (configurable per restaurant)
- Cashback participant rate: 7.5% (automatic for restaurants in cashback program)
- Custom rates with notes for special agreements
- Commission calculated on total transaction value (including vouchers/credits)

**Loyalty Tiers (5 levels)**
- Bronze: 1% cashback, €0-500 spending
- Silver: 2% cashback, €500-2,000 spending
- Gold: 3% cashback, €2,000-5,000 spending
- Platinum: 4% cashback, €5,000-15,000 spending
- Black: 5% cashback, €15,000+ spending

**Settlement System**
- Weekly settlement cycle (Friday-to-Friday)
- Automatic settlement generation for all active restaurants
- Status tracking: pending → processing → paid
- Stripe Connect integration for automated payouts
- Bank export CSV for manual transfers

**Wallet Adjustments**
- Admin can credit/debit/bonus/correct user wallets
- Minimum 10 character reason required for audit trail
- All adjustments logged with admin ID and timestamp

**Admin Panel Tabs**
- CommissionsTab: Restaurant commission rates, cashback toggle, pending settlements
- UsersFinancialTab: User wallets, loyalty tiers, transaction history, CSV export
- FinancesTab: Settlement generation, payout processing, bank exports

## External Dependencies

- **PostgreSQL**: Primary database for all application data (Neon-backed).
- **Stripe**: Payment gateway for processing transactions.
- **Object Storage**: Used for file uploads (e.g., recipe images).
- **Capacitor**: Framework for building native mobile applications from the web codebase.
- **OpenAI**: Powers the AI Support System via Replit AI Integrations.
- **MLKit**: Used in Capacitor for QR code scanning functionalities in the restaurant portal.
- **@tanstack/react-query**: For data fetching and caching in the frontend.
- **drizzle-orm**: Type-safe ORM for database interactions.
- **wouter**: Client-side routing library for React.

## Known Configuration Notes
- **SendGrid**: The `SENDGRID_API_KEY` environment variable is configured. The email service (`server/emailService.ts`) uses `no-replay@eatoff.app` as the sender address. All email functions (`sendGiftVoucherEmail`, `sendVerificationEmail`, `sendOrderConfirmationToCustomer`) use this same sender.
- **wouter**: Client-side routing library for React.