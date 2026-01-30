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
- **Cashback & Loyalty System**: Comprehensive system for managing EatOff-wide and restaurant-specific cashback groups, customer credit accounts with an approval flow, and loyalty tiers with automatic upgrades based on spending.
- **Marketplace System**: Supports multiple countries and currencies, with dynamic Stripe top-up based on the marketplace's currency.

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