# EatOff

## Overview

EatOff is a restaurant voucher platform enabling customers to purchase discounted meal packages with Pay Later functionality. The platform supports variable voucher packages, flexible pricing with interest charges or discounts, QR payment generation, wallet management, and restaurant portal.

## User Preferences

- Preferred communication style: Simple, everyday language (Romanian preferred)
- UI Pattern: Inline expandable sections preferred over modals for better UX
- Component Choice: Native HTML select elements over Radix UI portaled components for positioning reliability

## System Architecture

### Current State

Full-stack JavaScript application with:

- **Frontend**: React 18 with Vite, Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Payments**: Stripe integration for payment processing
- **Storage**: Object Storage for file uploads

### Mobile App (Capacitor)

Native mobile apps are built using Capacitor, which wraps the web app:

- **Config**: `capacitor.config.ts` - App ID: `com.eatoff.app`
- **Android**: `android/` directory - Open with Android Studio
- **iOS**: `ios/` directory - Open with Xcode

#### Mobile UX Architecture

The app has a dual-layout approach:
- **Web (desktop)**: Existing layout with Header/Footer
- **Mobile (Capacitor/responsive)**: Separate layout inspired by Revolut + Glovo

**Mobile Detection**:
- `client/src/hooks/useIsMobile.ts` - Hooks for screen size and Capacitor detection
- Auto-redirect to `/m` routes when running in Capacitor

**Mobile Routes** (`/m/*`):
- `/m` - Home (wallet hero, search, categories, AI recommendations)
- `/m/explore` - Restaurant discovery with filters
- `/m/ai-menu` - AI-powered food recommendations
- `/m/wallet` - Balance, vouchers, cashback, transactions
- `/m/profile` - User settings and QR code

**Mobile Components** (`client/src/components/mobile/`):
- `MobileLayout.tsx` - 5-tab bottom navigation
- `WalletCard.tsx` - Hero card with balance display
- `CategoryChips.tsx` - Horizontal scrollable filters
- `RestaurantCard.tsx` - Restaurant listing cards
- `DealBanner.tsx` - Promotional banners

**Design System**: "Bright Clean"
- Background: White (#FFFFFF)
- Secondary text: Gray (#667085)
- Accent: Teal/green primary
- Rounded corners: 20-24px
- Spacing: 8px grid

#### Mobile Build Commands
```bash
./mobile-build.sh         # Build with mobile env vars
npm run build              # Build web assets
npx cap sync              # Sync web assets to native platforms
npx cap open android      # Open Android project in Android Studio
npx cap open ios          # Open iOS project in Xcode
```

### Key Files

- `client/src/App.tsx` - Main React app with routing
- `client/src/pages/` - Page components
- `client/src/components/` - Reusable components
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database operations
- `shared/schema.ts` - Drizzle ORM schema and types
- `capacitor.config.ts` - Capacitor mobile app configuration

## External Dependencies

### Configured Services

- **PostgreSQL** - Database (Neon-backed via Replit)
- **Stripe** - Payment processing
- **Object Storage** - File uploads
- **Capacitor** - Native mobile app wrapper (Android/iOS)

### Key Packages

- `@capacitor/core`, `@capacitor/android`, `@capacitor/ios` - Mobile app framework
- `@tanstack/react-query` - Data fetching
- `drizzle-orm` - Type-safe ORM
- `stripe` - Payment processing
- `wouter` - Client-side routing

## Recent Changes

- **2025-01-22**: Implemented complete mobile UX with 5-tab navigation (Home, Explore, AI Menu, Wallet, Profile)
- **2025-01-22**: Added mobile detection hooks, auto-redirect for Capacitor apps, and mobile-specific components
- **2025-01-21**: Added Capacitor for native Android/iOS mobile app builds
- Converted QR Payment Modal to inline expandable Card component
- Fixed React hooks order violation in WalletPage
- Replaced Radix UI dropdowns with native HTML select elements
