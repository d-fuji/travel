# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a travel planning app that allows couples and families to collaboratively plan trips and generate simple vlogs from their travel photos and videos. The MVP focuses on Phase 1 features: user management, travel group creation, and collaborative itinerary planning.

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Target Platform**: Mobile-first responsive design

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### Core Components

- `AuthForm`: Handles user login and registration
- `Layout`: Main app layout with header and navigation
- `ItineraryBoard`: Collaborative itinerary planning interface with real-time editing
- `WishlistPanel`: Personal and shared wishlist management
- `CreateGroupModal`: Group creation and member invitation

### State Management

- `authStore`: User authentication and profile management
- `travelStore`: Travel groups, trips, itinerary items, and wishlist management

### Key Features (MVP)

1. **User Management**: Email/password authentication with profile setup
2. **Travel Groups**: Create groups and invite members by email
3. **Collaborative Planning**: Real-time itinerary editing with timeline view (morning/afternoon/evening)
4. **Wishlist System**: Personal and shared "places to visit" lists with ability to move items to itinerary

## File Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── travel/[id]/       # Travel detail page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── stores/               # Zustand state stores
├── types/                # TypeScript type definitions
└── globals.css           # Global styles
```

## Development Notes

- Mock authentication system (replace with real API in production)
- Mobile-first responsive design optimized for smartphone usage
- All text in Japanese for target market
- Uses Tailwind CSS for consistent styling and rapid development