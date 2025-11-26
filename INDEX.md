# Documentation Index
## Available Documentation
| File                           | Purpose                        | Use When                                      |
| ------------------------------ | ------------------------------ | --------------------------------------------- |
| **MIGRATION_CHECKLIST.md**     | Current migration status       | Tracking what's left to do                    |
| **TARKOV_TRACKER_ANALYSIS.md** | Complete technical breakdown   | Need deep understanding of original Vue 3 app |
| **NUXT_STRUCTURE_MAPPING.md**  | Migration implementation guide | Converting Vue 3 → Nuxt 3 patterns            |
## Key Systems
**Three-Store Pinia Architecture**:
- `tarkov.ts` - Game progress (syncs to `user_progress`)
- `user.ts` - User preferences (syncs to `user_preferences`)
- `progress.ts` - Computed team aggregations (read-only)
  **Two Game Modes**: PvP and PvE maintain separate progress in same state structure (only 'pvp' and 'pve' modes supported)
  **Backend**: Supabase for auth/db, Cloudflare Workers for functions (in progress)
  **API**: Nuxt server-side proxy → tarkov.dev GraphQL API for game data
## Critical Areas Requiring Care
1. **Game mode state structure** - Must preserve `{ currentGameMode, pvp: {...}, pve: {...} }`
2. **Data migration system** - Converts legacy single-mode → separate PvP/PvE structure
3. **Supabase sync** - Two-way debounced sync between Pinia and database
4. **Team collaboration** - Dynamic stores created per teammate
## Original Project
Reference source at: `/home/lab/Github/TarkovTracker/`