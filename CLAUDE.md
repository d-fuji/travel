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

## Design System & Coding Standards

### UI/UX Design Standards

#### Modal Design
- **Standard overlay**: Use `fixed inset-0 bg-black bg-opacity-50` for modal backgrounds
- **Z-index management**: 
  - Base modals: `z-50`
  - Nested/confirmation modals: `z-60`
  - Never exceed `z-[100]` without documentation
- **Modal sizing**: Use `w-full max-w-md` for standard modals
- **Positioning**: Center with `flex items-center justify-center p-4`

#### Component Styling
- **Rounded corners**: Use `rounded-2xl` for cards and modals, `rounded-lg` for buttons and inputs
- **Spacing**: Follow 4px grid system (p-4, m-4, gap-3, etc.)
- **Colors**: 
  - Primary actions: `bg-primary-600 hover:bg-primary-700`
  - Secondary actions: `bg-gray-100 hover:bg-gray-200`
  - Destructive actions: `bg-red-600 hover:bg-red-700` or `bg-red-100 text-red-600`
- **Shadows**: Use `shadow-sm` for cards, avoid heavy shadows

#### Responsive Design
- Mobile-first approach: Design for 375px width minimum
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`)
- Ensure touch targets are minimum 44px
- Stack elements vertically on mobile, horizontal on desktop

### Coding Standards

#### React/TypeScript
- Use `'use client'` directive for client components
- Define interfaces for all props and data structures
- Use optional chaining (`?.`) for potentially undefined properties
- Implement proper error boundaries and error handling

#### State Management (Zustand)
- Keep stores focused and cohesive
- Use async/await for API calls within store actions
- Implement optimistic updates where appropriate
- Handle loading and error states consistently

#### Error Handling
- Always wrap API calls in try-catch blocks
- Provide user-friendly error messages in Japanese
- Log detailed errors to console for development
- Use `alert()` for critical errors (temporary solution)

#### Performance Guidelines
- Use `useEffect` with proper dependency arrays
- Implement lazy loading for large datasets
- Minimize re-renders with proper state structure
- Use `React.memo` for expensive components when needed

#### Code Organization
- One component per file
- Co-locate related components (e.g., modals near their parent)
- Use descriptive names that indicate purpose
- Group imports: React hooks, external libraries, internal components, types

#### API Integration
- Use consistent error handling across all API calls
- Implement proper loading states
- Handle authentication errors gracefully
- Use TypeScript interfaces for API responses

### Accessibility Standards
- Use semantic HTML elements
- Implement proper ARIA labels for interactive elements
- Ensure keyboard navigation works for all interactive components
- Maintain sufficient color contrast ratios
- Provide alternative text for images

### Testing Considerations
- Write tests for utility functions (see `expenseCalculations.test.ts`)
- Test error scenarios and edge cases
- Ensure mobile responsiveness through manual testing
- Test keyboard navigation and screen reader compatibility