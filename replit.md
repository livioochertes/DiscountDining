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

#### Mobile Permissions
- **iOS**: Location permissions configured in `ios/App/App/Info.plist` (NSLocationWhenInUseUsageDescription)
- **Android**: Location permissions configured in `android/app/src/main/AndroidManifest.xml` (ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION)

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

## Multi-Language System

The app supports 6 languages with automatic detection:
- **Languages**: English (en), Spanish (es), French (fr), German (de), Italian (it), Romanian (ro)
- **Auto-detection**: Uses `navigator.language` on first visit
- **Persistence**: Selected language saved in localStorage
- **Context**: `client/src/contexts/LanguageContext.tsx` contains all translations
- **Usage**: `const { t, language, setLanguage } = useLanguage()` hook

**Mobile Language Selector**:
- Located in mobile header (MobileHome.tsx) next to notification bell
- Dropdown with language options

**Translation Coverage**:
- All mobile pages fully translated
- Desktop pages partially translated (in progress)
- City names remain as proper nouns (not translated)

### AI Support System

The platform includes an AI-powered customer support system:

**Database Tables** (in `shared/schema.ts`):
- `support_conversations` - Chat sessions with customers
- `support_messages` - Individual messages in conversations
- `support_tickets` - Escalated issues requiring human review
- `knowledge_base` - FAQ articles for AI and customer self-service
- `support_analytics` - Metrics tracking (deflection rate, CSAT)

**API Endpoints** (`server/supportRoutes.ts`):
- `POST /api/support/conversations` - Start new chat
- `POST /api/support/conversations/:id/messages` - Send message (SSE streaming)
- `GET /api/help/articles` - Public FAQ articles
- Admin endpoints with auth: `/api/admin/support/tickets`, `/api/admin/knowledge-base`

**Components**:
- `SupportChatWidget.tsx` - Floating chat bubble with AI streaming responses
- `MobileHelpFAQ.tsx` - FAQ page with search and categories
- `MobileHelpTerms.tsx` - Terms of Service page
- `MobileHelpPrivacy.tsx` - Privacy Policy page
- Admin Helpdesk tab in `eatoff-admin-dashboard.tsx`

**AI Features**:
- Uses OpenAI via Replit AI Integrations
- RAG-based knowledge base search for contextual answers
- Automatic escalation to tickets for: refund, payment, legal, security issues
- Responds in user's language (Romanian/English)
- System prompt limits responses to 200 words

**Escalation Keywords**: refund, rambursare, payment failed, account hacked, legal, speak to human, complaint, manager

## Recent Changes

- **2025-01-29**: Added AI Support System with chat widget, knowledge base, FAQ pages, and admin helpdesk with real-time data
- **2025-01-26**: Added token-based OAuth exchange for mobile - server generates one-time token after OAuth, passes via deep link, app exchanges token for session in WebView context via /api/auth/mobile-exchange endpoint
- **2025-01-26**: Implemented browser-based OAuth for Google Sign-In on mobile - opens external browser instead of WebView SDK, uses deep link (eatoff://oauth-callback) for callback, with proper session security (httpOnly, secure in production)
- **2025-01-26**: Added deep link handling in MobileSignIn and MobileSignUp with URL parsing error handling and scheme validation
- **2025-01-26**: Configured Android manifest intent-filter for eatoff://oauth-callback deep link scheme
- **2025-01-25**: Added priority (1-5) and position inline controls in Admin Dashboard for both restaurants and EatOff vouchers with PATCH API endpoints
- **2025-01-25**: Updated voucher sorting across all mobile views (MobileHome, MobileExplore, per-restaurant rows) to use priority → position → voucher type → discount/bonus
- **2025-01-25**: Fixed cache invalidation for EatOff voucher priority updates to include /api/eatoff-vouchers and /api/restaurants queries
- **2025-01-25**: Complete multi-language implementation for all mobile pages - replaced all hardcoded Romanian text with translation keys across MobileHome, MobileExplore, MobileRestaurantDetail, MobileWallet, MobileProfile, MobileAIMenu, MobileSignIn
- **2025-01-25**: Added language selector to mobile header with 6 language options and auto-detection from browser
- **2025-01-25**: Fixed home page voucher list auto-refresh - now updates automatically when vouchers are created/updated/deleted from Admin or Restaurant Portal
- **2025-01-25**: Migrated EatOff vouchers from in-memory storage to PostgreSQL database for data persistence
- **2025-01-25**: Changed storage export from MemStorage to DatabaseStorage - all data now persists in PostgreSQL
- **2025-01-25**: Added automatic seeding of EatOff vouchers to database if table is empty
- **2025-01-25**: Fixed voucher value display on restaurant detail page - now correctly shows totalValue and bonusPercentage badges
- **2025-01-22**: Implemented dynamic status bar height detection using `StatusBar.getInfo()` for proper spacing across all Android devices
- **2025-01-22**: Implemented complete mobile UX with 5-tab navigation (Home, Explore, AI Menu, Wallet, Profile)
- **2025-01-22**: Added mobile detection hooks, auto-redirect for Capacitor apps, and mobile-specific components
- **2025-01-21**: Added Capacitor for native Android/iOS mobile app builds
- Converted QR Payment Modal to inline expandable Card component
- Fixed React hooks order violation in WalletPage
- Replaced Radix UI dropdowns with native HTML select elements
