# Buddy Script - Next.js Social Media Web Application

Buddy Script is a modern, high-performance, and scalable social media web application built with the Next.js App Router, React 19, TypeScript, Axios, and TanStack Query. 

This repository implements a clean frontend architecture designed to support high traffic and maintain strict isolation of feature domains.

---

## Key Features

*   **Interactive Feed with Seamless Infinite Scroll**:
    *   Retrieves chronological feed posts via cursor-based pagination parameters.
    *   Employs an optimized `IntersectionObserver` that observes the 6th-from-last post to pre-fetch the next page of results proactively before the user reaches the absolute bottom.
    *   Uses pure derived rendering patterns to eliminate cascading hydration and React Query sync loop side-effects.
*   **Direct Cloudinary File Uploads**:
    *   Implements a zero-exposure uploading flow. First generates upload signatures from `/posts/presigned-url` securely on the backend, then posts binary content directly from the client to Cloudinary.
    *   Supports dynamic photo and video formats with live preview cards and cancel-upload options in the UI.
*   **Interactive Mutations**: Real-time client-side synchronization for liking/reacting to posts, adding custom comments, deleting posts, and instantly prepending newly created posts.
*   **Dual Mode Theme**: Toggle smoothly between Light Mode and Dark Mode with persistent UI wrapper support.
*   **Secure Authentication**: Fully integrated Login and Registration forms backed by dynamic validation (Zod schemas) and automated Gravatar profile picture setups.
*   **Robust Token Lifecycle Management**: 
    *   Automatic request interception to inject Bearer tokens.
    *   Silent token refresh handler using cookies and device identifier (`deviceId`) to resolve concurrent 401 requests gracefully.
*   **Protected Routing**: Next.js middleware guards private dashboards and restricts authenticated users from accessing login/registration views.

---

## Technology Stack

*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
*   **Library**: [React 19](https://react.dev/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **State Management & Caching**: [TanStack React Query v5](https://tanstack.com/query/latest)
*   **HTTP Client**: [Axios](https://axios-http.com/)
*   **Validation**: [Zod](https://zod.dev/)
*   **Styling**: Pure CSS stylesheets (`common.css`, `main.css`, `responsive.css`) integrated via static public assets and Bootstrap.

---

## Clean Architecture & Directory Structure

The project strictly follows a feature-isolated directory structure where all business logic is encapsulated within self-contained modules.

```text
social_media_appifylab/
├── public/                 # Static assets (images, icons, CSS stylesheets)
├── src/
│   ├── app/                # ROUTING LAYER (Next.js Page/Layout Routes)
│   │   ├── (route-group)/  # Optional Route Groups
│   │   ├── login/          # Login Page Route
│   │   ├── register/       # Registration Page Route
│   │   ├── layout.tsx      # Global layout (Injects global Providers)
│   │   └── page.tsx        # Public/Protected Feed Landing Page
│   │
│   ├── components/         # GLOBAL PURE PRESENTATIONAL UI
│   │   ├── ui/             # Atomic design elements (Buttons, Inputs, Modals)
│   │   └── layout/         # Core structural layout components (Navbar, Sidebar)
│   │
│   ├── config/             # VALIDATED ENVIRONMENT CONFIGURATIONS
│   │   └── env.config.ts   # Zod-validated environment configurations
│   │
│   ├── features/           # BUSINESS DOMAINS (Feature-Isolated Directories)
│   │   └── [feature-name]/ 
│   │       ├── components/ # Presentational/UI components specific to this feature
│   │       ├── services/   # Unified API request functions (Pure TypeScript files)
│   │       ├── hooks/      # TanStack Query logic, mutation lifecycle, and routing
│   │       └── types/      # TypeScript types and Zod schemas (Zod placement rule)
│   │
│   ├── hooks/              # GLOBAL UTILITY HOOKS (Pure UI helpers, e.g., use-debounce)
│   ├── lib/                # INITIALIZATION OF THIRD-PARTY CLIENTS
│   │   └── api-client.ts   # Configured Axios instance with interceptors for silent token refresh
│   ├── providers/          # GLOBAL CLIENT PROVIDERS
│   │   └── query-provider.tsx # Houses the TanStack QueryClient Provider wrapper
│   ├── utils/              # PURE UTILITIES (Formatting, cookie management, etc.)
│   └── middleware.ts       # GLOBAL ROUTE GUARD (Edge-level authorization validator)
```

### Core Architectural Rules

1.  **Unified Service & Hook Pattern (CSR & ISR API Isolation)**:
    *   The `services/` layer is strictly for making raw HTTP requests (using `apiClient` for client-side rendering (CSR) or native `fetch` for incremental static regeneration (ISR)). It does not import React hooks or store state.
    *   The `hooks/` layer wraps services inside TanStack Query/Mutation hooks to manage cache, lifecycles, and client side redirects.
    *   UI components must **never** call `apiClient` directly; they consume domain-specific hooks.
2.  **Avoid Pure SSR**:
    *   We avoid pure Server-Side Rendering (`cache: 'no-store'`) for public/semi-public views to handle heavy traffic spikes.
    *   We use **ISR/ISG (Incremental Static Regeneration/Generation)** for data/SEO views and **CSR (Client-Side Rendering)** for interactive components.
3.  **Code Isolation & Zod Validation**:
    *   Zod validation schemas reside strictly inside `src/features/[feature-name]/types/[feature-name].types.ts`. All types are derived using `z.infer<typeof schema>`.

---

## Authentication & API Interception Flow

The application utilizes an advanced Axios interceptor in [api-client.ts](file:///e:/social_media_appifylab/src/lib/api-client.ts) to manage JWT tokens stored in browser cookies:

1.  **Authorization Injection**: Every client-side request automatically checks for an `accessToken` cookie and appends it as a `Bearer` token in the request header.
2.  **Silent Token Refresh**:
    *   If a request fails with a `401 Unauthorized` status, it intercepts the error.
    *   It checks for a valid `refreshToken` and `deviceId`.
    *   It queues up concurrent failed requests while executing a POST to `/auth/refresh-token`.
    *   Upon a successful refresh, the new tokens are stored, and the queued requests are retried automatically.
    *   If the token refresh fails, it automatically deletes credentials from cookies and redirects the user to `/login`.

---

## Getting Started & Setup

### 1. Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 2. Environment Setup

Clone the `.env.example` file to `.env` in the root directory:

```bash
cp .env.example .env
```

Configure the environment variables:

```properties
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### 3. Install Dependencies

Install project packages using `npm`:

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The application will start at [http://localhost:3000](http://localhost:3000).

### 5. Production Build

Build the optimized production bundles:

```bash
npm run build
```

Start the built server:

```bash
npm run start
```

### 6. Linting

Run ESLint to check for stylistic and programmatic issues:

```bash
npm run lint
```
