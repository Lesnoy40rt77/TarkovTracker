# Comprehensive Codebase Analysis - TarkovTracker

## Executive Summary

**Last Updated:** November 30, 2025  
**Nuxt Version:** 3.x (with Nuxt 4 compatibility layer)  
**Status:** Production-Ready

This document provides a complete technical analysis of the TarkovTracker Nuxt application. The codebase is well-architected, follows modern Vue 3/Nuxt 3 best practices, and includes comprehensive team collaboration features with real-time synchronization.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Configuration Analysis](#configuration-analysis)
3. [Store Architecture](#store-architecture)
4. [Composables Layer](#composables-layer)
5. [Feature Modules](#feature-modules)
6. [API Layer](#api-layer)
7. [Security Analysis](#security-analysis)
8. [Performance Optimizations](#performance-optimizations)
9. [Testing Infrastructure](#testing-infrastructure)
10. [Identified Issues & Recommendations](#identified-issues--recommendations)
11. [Resolution Status](#resolution-status)

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Nuxt 3.x | Vue 3 meta-framework with file-based routing |
| **State** | Pinia | Centralized state management with persistence |
| **Backend** | Supabase | PostgreSQL, Auth, Realtime, Edge Functions |
| **Edge** | Cloudflare Workers | Rate limiting, API gateway |
| **Styling** | TailwindCSS + Vuetify | Utility-first CSS with component library |
| **Graphs** | Graphology | Task/hideout dependency visualization |
| **Caching** | IndexedDB | Client-side API response caching |
| **i18n** | Vue I18n | 6 language localization (en, de, es, fr, ru, uk) |

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cloudflare Pages (SPA)                      │
│                         ssr: false                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ Cloudflare Worker│ │ Supabase Edge Fn │ │   Supabase DB    │
│  (team-gateway)  │ │  (8 functions)   │ │   + Realtime     │
│  Rate Limiting   │ │  Team/Token Ops  │ │   PostgreSQL     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  tarkov.dev API  │
                     │  (Game Metadata) │
                     └──────────────────┘
```

### Directory Structure

```
app/
├── components/ui/          # Shared UI components
├── composables/            # Vue composables (hooks)
│   ├── api/               # API data fetching
│   ├── supabase/          # Supabase integration
│   ├── utils/             # Utility composables
│   └── __tests__/         # Composable tests
├── features/              # Feature-based modules
│   ├── auth/              # Authentication UI
│   ├── dashboard/         # Dashboard widgets
│   ├── hideout/           # Hideout management
│   ├── maps/              # Map views
│   ├── neededitems/       # Item tracking
│   ├── settings/          # User preferences
│   ├── tasks/             # Quest tracking
│   ├── team/              # Team collaboration
│   └── traders/           # Trader reputation
├── pages/                 # File-based routing
├── plugins/               # Nuxt plugins
├── server/api/            # Nitro server routes
├── shell/                 # Layout components
├── stores/                # Pinia stores
├── types/                 # TypeScript definitions
└── utils/                 # Utility functions
```

---

## Configuration Analysis

### nuxt.config.ts

**Key Configuration:**

```typescript
{
  ssr: false,                    // SPA mode for Cloudflare Pages
  srcDir: 'app',                 // Source in app/ directory
  future: { compatibilityVersion: 4 }, // Nuxt 4 compatibility
  nitro: {
    preset: 'cloudflare_pages',
    prerender: { routes: ['/'] }
  }
}
```

**Build Optimizations:**

| Chunk | Contents | Purpose |
|-------|----------|---------|
| `vendor-d3` | d3-* libraries | Graph visualization |
| `vendor-graphology` | graphology-* | Dependency graphs |
| `vendor-supabase` | @supabase/* | Supabase client |
| `ui-vendor` | vuetify, vue-i18n | UI framework |
| `core-vendor` | pinia, vue-router | Core Vue plugins |

### app.config.ts

**Theme Configuration:**

| Color | Hex | Usage |
|-------|-----|-------|
| `primary` | `#0D47A1` | Main brand color |
| `pvp` | `#D32F2F` | PVP mode indicators |
| `pve` | `#2E7D32` | PVE mode indicators |
| `brand` | `#9A8866` | Tarkov-themed accents |
| `accent` | `#FFC107` | Highlights |

### TypeScript Configuration

- **Strict Mode:** Enabled with `noImplicitAny: false` (migration in progress)
- **Module Resolution:** Bundler mode with path aliases
- **Lint Rules:** ESLint with Vue, TypeScript, and Prettier integration

---

## Store Architecture

### Store Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      useApp.ts                               │
│              (Initialization Orchestrator)                   │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│   useTarkov.ts   │ │  useMetadata.ts  │ │  useTeamStore.ts │
│   User Progress  │ │   Game Data      │ │   Team Ops       │
│   Supabase Sync  │ │   Graphs         │ │   Edge Functions │
└──────────────────┘ └──────────────────┘ └──────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  useProgress.ts  │ │ usePreferences.ts│ │useSystemStore.ts │
│  Aggregated View │ │  User Settings   │ │  App State       │
│  Team Progress   │ │  LocalStorage    │ │  UI State        │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

### Store Details

#### useTarkov.ts (Main User Store)

**Responsibilities:**
- User progress data (tasks, hideout, traders)
- Dual game mode support (PVP/PVE)
- Supabase synchronization with conflict resolution
- Data migration for legacy localStorage users

**Key Features:**
```typescript
// Optimized sync with pause/resume
const { pause, resume, isActive } = useSyncController()

// Debounced persistence
watchDebounced(state, syncToSupabase, { debounce: 1000 })

// Validation before sync
validateStorageUserId(userId, storedData)
```

**State Shape:**
```typescript
interface UserProgressData {
  version: number
  lastModified: number
  pvp: GameModeProgress  // PVP-specific progress
  pve: GameModeProgress  // PVE-specific progress
}
```

#### useMetadata.ts (Game Data Store)

**Responsibilities:**
- Fetches game data from tarkov.dev GraphQL API
- Builds task/hideout dependency graphs
- Caches responses in IndexedDB

**Key Features:**
```typescript
// Singleton initialization guard
let initPromise: Promise<void> | null = null

// Non-reactive graph data for performance
state.taskGraph = markRaw(buildTaskGraph(tasks))
state.hideoutGraph = markRaw(buildHideoutGraph(stations))
```

#### useProgress.ts (Aggregated View)

**Responsibilities:**
- Combines user progress with teammate data
- Provides computed views for UI components
- Optimizes team data access with pre-caching

**Key Features:**
```typescript
// Memoized team progress
const unlockedTasks = computed(() => {
  const teammateData = getPreCachedTeammateProgress()
  return calculateUnlockedTasks(ownProgress, teammateData)
})
```

#### useTeamStore.ts (Team Operations)

**Responsibilities:**
- Team CRUD operations via edge functions
- Teammate data synchronization
- Dynamic teammate store creation

**Key Features:**
```typescript
// Retry logic for transient failures
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T>

// Dynamic teammate stores
function getTeammateStore(userId: string): Store
```

---

## Composables Layer

### API Composables (`app/composables/api/`)

| Composable | Purpose | Features |
|------------|---------|----------|
| `useTarkovData.ts` | Fetch game metadata | GraphQL queries, IndexedDB caching |
| `useGraphQL.ts` | GraphQL client | Error handling, type safety |

### Supabase Composables (`app/composables/supabase/`)

| Composable | Purpose | Features |
|------------|---------|----------|
| `useSupabaseSync.ts` | Progress sync | structuredClone + toRaw optimization |
| `useSupabaseListener.ts` | Realtime subscriptions | Reactive filter refs, auto-cleanup |
| `useSupabaseAuth.ts` | Auth state | Session management |
| `useEdgeFunctions.ts` | Edge function calls | Gateway-first with fallback |

**Sync Optimization:**
```typescript
// Deep clone without reactivity for Supabase upload
const cleanData = structuredClone(toRaw(reactiveState))
```

### Feature Composables

| Composable | Purpose | Features |
|------------|---------|----------|
| `useTaskFiltering.ts` | Task list filtering | 15+ filter options, faction support |
| `useHideoutFiltering.ts` | Hideout filtering | Station type, level, skill validation |
| `useGraphBuilder.ts` | Dependency graphs | Graphology integration, path finding |
| `useDashboardStats.ts` | Dashboard metrics | Progress percentages, trader levels |
| `useAppInitialization.ts` | Boot sequence | Auth → Metadata → Progress |

### Utility Composables

| Composable | Purpose |
|------------|---------|
| `useLocalStorage.ts` | Type-safe localStorage wrapper |
| `useExpansionSync.ts` | Persist expansion panel states |
| `useSharedBreakpoints.ts` | Singleton viewport breakpoints |
| `useTarkovTime.ts` | In-game time calculation |
| `useInfiniteScroll.ts` | Virtualized list scrolling |

---

## Feature Modules

### Team Feature (`app/features/team/`)

**Components:**

| Component | Purpose | Status |
|-----------|---------|--------|
| `MyTeam.vue` | Main team management | ✅ Complete |
| `TeamMemberCard.vue` | Member display | ✅ Complete |
| `TeamInvite.vue` | Invite link generation | ✅ Complete |
| `TeammateSyncStatus.vue` | Real-time sync indicator | ✅ Complete |
| `TeamLeaveDialog.vue` | Leave/delete confirmation | ✅ Complete |
| `TeamKickDialog.vue` | Kick member confirmation | ✅ Complete |

**Team Flow:**
```
Create Team → Generate Invite → Share Link → Join Team → Real-time Sync
     │              │                              │            │
     ▼              ▼                              ▼            ▼
 team-create   team-create                    team-join   Supabase
 edge fn       (returns invite_code)          edge fn     Realtime
```

### Tasks Feature (`app/features/tasks/`)

**Components:**

| Component | Purpose |
|-----------|---------|
| `TasksView.vue` | Main task list with filtering |
| `TaskRow.vue` | Individual task display |
| `TaskFilterPanel.vue` | Advanced filter controls |
| `TaskGraph.vue` | Dependency visualization |
| `TaskPopover.vue` | Quick task details |
| `ObjectiveRow.vue` | Objective completion tracking |

### Hideout Feature (`app/features/hideout/`)

**Components:**

| Component | Purpose |
|-----------|---------|
| `HideoutView.vue` | Station grid view |
| `HideoutCard.vue` | Station card with upgrades |
| `HideoutFilterPanel.vue` | Filter by type/level |

**Skill Validation:**
```typescript
// HideoutCard.vue - validates skill prerequisites
const hasRequiredSkills = computed(() => {
  return level.skillRequirements.every(req => 
    userSkillLevel(req.skill.name) >= req.level
  )
})
```

### Dashboard Feature (`app/features/dashboard/`)

**Widgets:**

| Widget | Purpose |
|--------|---------|
| `TasksWidget.vue` | Task progress overview |
| `HideoutWidget.vue` | Hideout completion status |
| `TradersWidget.vue` | Trader reputation levels |
| `TeamWidget.vue` | Team member activity |
| `MapsWidget.vue` | Map quick links |

### Settings Feature (`app/features/settings/`)

**Sections:**

| Section | Purpose |
|---------|---------|
| `AppearanceSettings.vue` | Theme, dark mode |
| `LanguageSettings.vue` | Locale selection |
| `GameModeSettings.vue` | PVP/PVE toggle |
| `APITokens.vue` | API access management |
| `AccountSettings.vue` | Account deletion |
| `DataExport.vue` | Progress export/import |

---

## API Layer

### Server Routes (`app/server/api/`)

| Route | Purpose | Caching |
|-------|---------|---------|
| `/api/tarkov/tasks` | Proxy to tarkov.dev | 5min CDN cache |
| `/api/tarkov/hideout` | Proxy to tarkov.dev | 5min CDN cache |
| `/api/tarkov/traders` | Proxy to tarkov.dev | 5min CDN cache |
| `/api/tarkov/items` | Proxy to tarkov.dev | 10min CDN cache |

**Caching Strategy:**
```typescript
// Server route example
export default defineEventHandler(async (event) => {
  setResponseHeaders(event, {
    'Cache-Control': 's-maxage=300, stale-while-revalidate=60'
  })
  return await fetchFromTarkovDev()
})
```

### Supabase Edge Functions (`supabase/functions/`)

| Function | Method | Purpose | Auth |
|----------|--------|---------|------|
| `team-create` | POST | Create team with invite code | Bearer token |
| `team-join` | POST | Join team via invite | Bearer token |
| `team-leave` | POST | Leave or delete team | Bearer token |
| `team-kick` | POST | Remove team member | Bearer token + Owner |
| `token-create` | POST | Generate API token | Bearer token |
| `token-revoke` | POST | Revoke API token | Bearer token |
| `account-delete` | POST | Cascade delete user data | Bearer token |
| `progress-update` | POST | Sync progress to DB | Bearer token |

**Edge Function Pattern:**
```typescript
// All edge functions follow this pattern
Deno.serve(async (req: Request) => {
  // 1. CORS preflight
  if (req.method === 'OPTIONS') return corsResponse()
  
  // 2. Auth validation
  const user = await validateAuth(req)
  
  // 3. Business logic with service role
  const result = await performOperation(user)
  
  // 4. Return JSON response
  return new Response(JSON.stringify(result), { headers: corsHeaders })
})
```

### Cloudflare Worker (`workers/team-gateway/`)

**Purpose:** Rate limiting and API gateway for team operations

**Rate Limits:**

| Action | Limit | Window |
|--------|-------|--------|
| `team-create` | 10 | 1 hour |
| `team-join` | 30 | 10 min |
| `team-leave` | 30 | 1 hour |
| `team-kick` | 20 | 1 hour |
| `token-create` | 8 | 1 hour |
| `token-revoke` | 50 | 10 min |

**Worker Features:**
- KV-based rate limiting with sliding window
- CORS origin allowlist validation
- Fallback path for team-leave (direct DB access)
- Token generation with SHA-256 hashing

**Gateway Pattern:**
```typescript
// Client → Worker → Edge Function → Supabase
// With fallback: Client → Worker → Direct Supabase REST
```

---

## Security Analysis

### Authentication

| Feature | Implementation | Status |
|---------|---------------|--------|
| OAuth Providers | Discord, Twitch | ✅ Configured |
| Session Management | Supabase Auth | ✅ Implemented |
| Token Refresh | Auto-refresh in plugin | ✅ Implemented |
| Popup Auth Flow | `signInWithOAuth({ redirectTo })` | ✅ Implemented |

### Authorization

| Resource | Protection | Status |
|----------|-----------|--------|
| User Progress | RLS policies | ✅ Protected |
| Team Data | Owner/member checks | ✅ Protected |
| API Tokens | User-scoped queries | ✅ Protected |
| Edge Functions | Bearer token validation | ✅ Protected |

### CORS Security

```typescript
// team-gateway worker
function resolveOrigin(envOrigin?: string, requestOrigin?: string) {
  if (!envOrigin || envOrigin === "*") return "*"
  const list = envOrigin.split(",").map(o => o.trim())
  if (requestOrigin && list.includes(requestOrigin)) return requestOrigin
  return list[0] // Default to first configured origin
}
```

### Rate Limiting

- **Implementation:** Cloudflare KV with time-bucketed keys
- **Key Format:** `rl:{bucket}:{action}:{ip}:{userId}`
- **Enforcement:** 429 response when limit exceeded

---

## Performance Optimizations

### Implemented Optimizations

| Optimization | Location | Impact |
|--------------|----------|--------|
| `markRaw()` for graphs | `useMetadata.ts` | Prevents reactive overhead |
| `structuredClone()` | `useSupabaseSync.ts` | Clean deep copy without proxy |
| `toRaw()` | `useSupabaseSync.ts` | Removes Vue reactivity |
| Debounced sync | `useTarkov.ts` | Reduces API calls |
| IndexedDB caching | `tarkovCache.ts` | Offline-capable data |
| Virtual scrolling | `useInfiniteScroll.ts` | Large list performance |
| Singleton breakpoints | `useSharedBreakpoints.ts` | Single resize listener |
| Manual chunks | `nuxt.config.ts` | Optimized bundle splitting |

### Bundle Optimization

```typescript
// vite.build.rollupOptions.output.manualChunks
{
  'vendor-d3': ['d3-*'],
  'vendor-graphology': ['graphology*'],
  'vendor-supabase': ['@supabase/*'],
  'ui-vendor': ['vuetify', 'vue-i18n'],
  'core-vendor': ['pinia', 'vue-router']
}
```

---

## Testing Infrastructure

### Configuration

- **Framework:** Vitest with `@nuxt/test-utils` environment
- **Setup:** `test-setup.ts` with cleanup hooks
- **Location:** Tests colocated with code in `__tests__/` directories

### Test Coverage

| Area | Coverage | Notes |
|------|----------|-------|
| Composables | Good | `useTaskFiltering`, `useDataMigration` tested |
| Stores | Partial | Core stores tested |
| Components | Limited | Snapshot tests for some |
| Edge Functions | None | Recommended for addition |
| E2E | None | Recommended for critical flows |

### Running Tests

```bash
npx vitest              # Run all tests
npx vitest --ui         # Interactive UI
npx vitest --coverage   # With coverage report
```

---

## Identified Issues & Recommendations

### Medium Priority

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Console logging | Throughout codebase (~100+ calls) | Migrate to `app/utils/logger.ts` |
| Prop drilling | Task filter components | Consider provide/inject or store |
| TODO comment | `AppBar.vue` | "TODO show user state" - implement or remove |

### Low Priority

| Issue | Location | Recommendation |
|-------|----------|----------------|
| Test coverage | Edge functions | Add Deno tests for edge functions |
| Integration tests | Team flow | Add E2E tests for team operations |
| SSR consideration | `nuxt.config.ts` | Consider SSR for SEO if needed |

### Code Quality

| Item | Status | Notes |
|------|--------|-------|
| TypeScript strict | Partial | `noImplicitAny: false` in migration |
| ESLint rules | Configured | Some rules at warn level |
| Vue SFC style | Consistent | `<script setup lang="ts">` throughout |
| Naming conventions | Consistent | PascalCase components, camelCase functions |

---

## Resolution Status

### Previously Identified Critical Issues

| Issue | Status | Resolution |
|-------|--------|------------|
| Team Feature Stubs | ✅ **RESOLVED** | Full implementation with 6+ components |
| CORS Security | ✅ **RESOLVED** | Origin allowlist in team-gateway |
| Account Deletion | ✅ **RESOLVED** | Edge function with cascade delete |
| State Sync Performance | ✅ **RESOLVED** | structuredClone + toRaw |
| Team Store Errors | ✅ **RESOLVED** | Try-catch with retry logic |
| Metadata Race Conditions | ✅ **RESOLVED** | initPromise singleton guard |
| Reactive Graph Performance | ✅ **RESOLVED** | markRaw() for graph data |
| Hideout Skill Validation | ✅ **RESOLVED** | Full prerequisite checking |
| Shared Breakpoints Leak | ✅ **RESOLVED** | Singleton pattern |

---

## Conclusion

The TarkovTracker codebase is **production-ready** with a well-designed architecture. Key strengths include:

1. **Clean Architecture:** Feature-based organization with clear separation of concerns
2. **Robust State Management:** Pinia stores with persistence and real-time sync
3. **Comprehensive Team System:** Full collaboration features with proper security
4. **Performance Optimizations:** Multiple layers of caching and reactivity optimization
5. **Type Safety:** TypeScript throughout with improving strict mode coverage

**Recommended Next Steps:**

1. Centralize logging with logger utility
2. Expand test coverage for edge functions
3. Consider E2E tests for critical user flows
4. Complete TypeScript strict mode migration

---

*Last analyzed: November 30, 2025*  
*Analysis scope: Full codebase review including configs, stores, composables, features, API layer, and infrastructure*
