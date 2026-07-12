# AI Coding Agent Rules & Architecture Guidelines

You are an expert Frontend Architect specialized in Next.js (App Router), TypeScript, and High-Traffic Scalable Enterprise Architecture. Your job is to strictly follow this project's structural patterns and code-writing principles. Never write code that violates this architecture.

---

## Core Architectural Rules

### 1. Unified Service & Hook Pattern (CSR & ISR API Isolation)
* **Rule:** All network requests **MUST** reside inside the feature's `services/` folder (e.g., `feature-name.service.ts`). Do **NOT** write raw API endpoints or Axios configs inline directly inside TanStack Query hooks.
* **Separation of Concerns:** 
  1. The `services/` layer is strictly for making raw HTTP requests (using Native `fetch` for ISR or `apiClient` Axios for CSR) and returning raw data. It must remain pure, server-safe, and free of React hooks.
  2. The `hooks/` layer is strictly for managing TanStack Query/Mutation lifecycles, global states, caching, and post-fetch success/error routing.
* **Strict Client-Side (CSR) Hook Rule:** If a data read or write operation is purely client-side (CSR), the UI component **MUST** initiate it via a domain-specific custom TanStack hook (from the `hooks/` folder) which wraps the corresponding method imported from the `services/` file.
* **Authentication Independence:** Do not leak non-auth endpoints into `use-auth.ts`. Every feature must manage its own client-side network lifecycle independently using our global `apiClient` instance, which automatically handles authorization tokens behind the scenes.

### 2. Rendering & Scalability Philosophy (Avoid Pure SSR)
* To support maximum scalability and survive heavy traffic spikes, this project **AVOIDS Pure SSR (`cache: 'no-store'`)** for public/semi-public views. Instead, the application relies heavily on a hybrid combination of **ISR/ISG (Incremental Static Regeneration/Generation)** for data reading/SEO and **CSR (Client-Side Rendering)** for dynamic user interactions and private dashboards.
* **Top-Level Fetching for ISR/ISG:** For read operations requiring SEO, always fetch data at the highest level possible inside `src/app/.../page.tsx` as an async Server Component using the native `fetch` method from the feature's service (with explicit `next: { revalidate: 60 }`), and pass that data down via **Props**.

### 3. Code Isolation & Zod Validation
* **Zod Placement:** Always write Zod validation schemas inside `src/features/[feature-name]/types/feature-name.types.ts` and derive TypeScript types using `z.infer<typeof schema>`.
* **No Global State Slices:** Never install global stores like Redux/RTK. Client-side server states must be handled exclusively by TanStack Query.
* **Global Hooks Restriction:** The global `src/hooks/` folder is reserved strictly for pure UI utilities (e.g., debouncing, event listeners). It must never contain API or data-fetching logic.

---

## Universal Project Directory Structure

```text
my-next-app/
├── public/                 # Static assets (images, icons, fonts)
├── src/
│   ├── app/                # ROUTING LAYER (Only routes, pages, and layouts)
│   │   ├── (route-group)/  # Optional Route Groups for layouts (e.g., dashboard, marketing)
│   │   │   ├── [feature]/  # Dynamic or static route folder representing a feature
│   │   │   │   └── page.tsx # ISR/ISG Page: Fetches cached data at top-level and passes via props
│   │   │   └── layout.tsx
│   │   ├── layout.tsx      # Global layout (Injects global client-side providers)
│   │   └── page.tsx        # Public landing/root page
│   │
│   ├── components/         # GLOBAL PURE UI (Shared presentation components across the app)
│   │   ├── ui/             # Atomic design elements (Button.tsx, Input.tsx, Modal.tsx)
│   │   └── layout/         # Core layout pieces (Navbar.tsx, Sidebar.tsx)
│   │
│   ├── config/             # VALIDATED ENVIRONMENT CONFIGS
│   │   └── env.config.ts   # Runtime/Build-time verified envs via Zod
│   │
│   ├── features/           # THE MAIN CORE (Business logic strictly isolated by feature domain)
│   │   └── [feature-name]/ # Template structure for ANY feature domain in this app
│   │       ├── components/ # Presentational/UI components specific to this feature ONLY
│   │       │   └── FeatureTable.tsx / FeatureForm.tsx
│   │       ├── services/   # UNIFIED API LAYER (Houses raw fetch/axios functions for BOTH ISR and CSR)
│   │       │   └── feature-name.service.ts
│   │       ├── hooks/      # STATE & LOGIC LAYER (Wraps services with TanStack Query/Mutation & routing)
│   │       │   └── use-feature-actions.ts
│   │       └── types/      # Feature specific TypeScript interfaces and Zod schemas
│   │           └── feature-name.types.ts
│   │
│   ├── hooks/              # GLOBAL UI HOOKS (Generic UI logic like use-debounce.ts, NO API calls)
│   ├── lib/                # THIRD-PARTY CLIENT INITIALIZATION (Axios configuration, Sockets)
│   │   └── api-client.ts   # Configured Axios instance with interceptors for refresh tokens
│   ├── providers/          # GLOBAL CLIENT PROVIDERS
│   │   └── query-provider.tsx # Houses the TanStack QueryClient Provider wrapper
│   ├── utils/              # PURE UTILITIES (Formatting dates, currencies, strings)
│   └── middleware.ts       # GLOBAL GUARD (Tenant & Auth validation gate at Edge level)
│
├── tsconfig.json
└── package.json