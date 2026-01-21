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

#### Mobile Build Commands
```bash
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

- **2025-01-21**: Added Capacitor for native Android/iOS mobile app builds
- Converted QR Payment Modal to inline expandable Card component
- Fixed React hooks order violation in WalletPage
- Replaced Radix UI dropdowns with native HTML select elements
