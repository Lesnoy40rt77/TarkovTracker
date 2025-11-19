### ✅ Completed Systems

- [x] Nuxt 4 app configured with `srcDir: app`, SPA mode (`ssr: false`)
- [x] Vuetify 3 integrated via `vite-plugin-vuetify` with auto-imports

## Remaining Work

### 1. Backend Integration & Testing

**Supabase Real-time Sync**
- [ ] End-to-end validation of Supabase real-time listeners with authenticated users
- [ ] Verify team collaboration features work with Supabase backend
- [ ] Test data synchronization under various network conditions

**Team Features Migration**
- [ ] Migrate team Cloud Functions to Cloudflare Workers
  - Currently marked with TODO comments in:
    - `app/features/team/TeamMembers.vue`
    - `app/features/team/MyTeam.vue`
    - `app/features/team/TeamInvite.vue`
    - `app/features/team/TeammemberCard.vue`

**API Token Management**
- [ ] Migrate API token generation to Cloudflare Workers
  - Currently marked with TODO in:
    - `app/features/settings/TokenCard.vue`
    - `app/features/settings/ApiTokens.vue`
    - `app/pages/api.vue`

### 2. Data Validation

- [ ] Test legacy data migration with real user data
- [ ] Verify PvP/PvE game mode switching maintains data integrity
- [ ] Validate Supabase sync handles all edge cases

### 3. Deployment Configuration

- [ ] Configure Cloudflare Pages deployment settings
- [ ] Set up Cloudflare Workers for backend functions
- [ ] Configure Supabase database schema and policies
- [ ] Set up environment variables for production

### 4. Testing & Quality Assurance

- [ ] Update existing tests for Supabase (currently have Firebase mocks)
- [ ] Add E2E tests for critical user flows
- [ ] Test performance with backdrop-filter removal (already done)
- [ ] Cross-browser testing
- [ ] Mobile responsiveness testing

---

## What Cannot Be Validated (Need Manual Testing)

The following items are implemented in code but require live testing with real users/data:

1. **Supabase Authentication Flow** - Login/logout with Discord and Twitch OAuth
2. **Real-time Team Sync** - Multiple users collaborating on same team
3. **Data Migration** - Users with legacy single-mode data upgrading to dual-mode
4. **Offline Support** - Pinia persistence when network is unavailable
5. **API Rate Limiting** - Apollo cache behavior under load

---

## Architecture Notes

### Backend Transition: Firebase → Supabase + Cloudflare Workers

The codebase is transitioning from Firebase to a new stack:

**Before:**
- Firebase Auth (OAuth)
- Firebase Firestore (Database)
- Firebase Cloud Functions (Backend)

**After:**
- Supabase Auth (OAuth) ✅ Implemented
- Supabase Database ✅ Plugin ready
- Cloudflare Workers (Backend) ⏳ In progress

### Key Files with TODOs

Search for `TODO: Move to Cloudflare Workers` in:
- `app/features/settings/TokenCard.vue`
- `app/features/settings/ApiTokens.vue`
- `app/features/team/*.vue`

**What's Left:**
- ⏳ Backend Cloud Functions → Cloudflare Workers migration
- ⏳ Live testing with authenticated users
- ⏳ Production deployment configuration
