import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { STORAGE_KEYS } from '@/utils/storageKeys';
import { hydrateUserFromSession } from '@/utils/userHydration';
type OAuthProvider = 'twitch' | 'discord' | 'google' | 'github';
type SupabaseUser = {
  id: string | null;
  loggedIn: boolean;
  email: string | null;
  displayName: string | null;
  username: string | null;
  avatarUrl: string | null;
  photoURL: string | null; // Alias for avatarUrl (backward compatibility)
  lastLoginAt: string | null;
  createdAt: string | null;
  provider: string | null; // 'discord', 'twitch', etc.
  providers: string[] | null; // All linked OAuth providers
};
export default defineNuxtPlugin(() => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  // Build a safe stub so components can still render in environments without Supabase env vars
  const buildStub = () => {
    const stubUser = reactive<SupabaseUser>({
      id: null,
      loggedIn: false,
      email: null,
      displayName: null,
      username: null,
      avatarUrl: null,
      photoURL: null,
      lastLoginAt: null,
      createdAt: null,
      provider: null,
      providers: null,
    });
    const noopPromise = async () => {
      logger.debug('[Supabase Stub] Operation called in offline mode');
      return {} as unknown;
    };
    const stubClient = {
      from: (table: string) => {
        logger.debug(`[Supabase Stub] from('${table}') called in offline mode`);
        return { upsert: noopPromise };
      },
      functions: {
        invoke: async (fnName: string) => {
          logger.debug(`[Supabase Stub] functions.invoke('${fnName}') called in offline mode`);
          return {};
        },
      },
      auth: {
        getSession: async () => {
          logger.debug('[Supabase Stub] auth.getSession called in offline mode');
          return { data: { session: null } };
        },
        onAuthStateChange: () => {
          logger.debug('[Supabase Stub] auth.onAuthStateChange called in offline mode');
          return { data: { subscription: { unsubscribe() {} } } };
        },
        signInWithOAuth: async () => {
          logger.debug('[Supabase Stub] auth.signInWithOAuth called in offline mode');
          return {
            data: { provider: '', url: null },
            error: new Error('OAuth not available in offline mode'),
          };
        },
        signOut: async () => {
          logger.debug('[Supabase Stub] auth.signOut called in offline mode');
          return {};
        },
      },
    } as unknown as SupabaseClient;
    return {
      client: stubClient,
      user: stubUser,
      isOfflineMode: true,
      signInWithOAuth: async (
        _provider: OAuthProvider,
        _options?: { skipBrowserRedirect?: boolean; redirectTo?: string }
      ) => {
        logger.error('[Supabase] Offline OAuth sign-in attempted', {
          provider: _provider,
          options: _options,
        });
        throw new Error('Supabase not configured - login unavailable in offline mode');
      },
      signOut: async () => {},
    };
  };
  if (!supabaseUrl || !supabaseKey) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
      throw new Error('Supabase configuration missing');
    }
    logger.info(
      '[Supabase] Running in offline mode - login/sync disabled. ' +
        'See .env.example to enable Supabase features.'
    );
    const stub = buildStub();
    return { provide: { supabase: stub } };
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const user = reactive<SupabaseUser>({
    id: null,
    loggedIn: false,
    email: null,
    displayName: null,
    username: null,
    avatarUrl: null,
    photoURL: null,
    lastLoginAt: null,
    createdAt: null,
    provider: null,
    providers: null,
  });
  supabase.auth.getSession().then(({ data: { session } }) => {
    hydrateUserFromSession(user, session?.user || null);
    // Clean up OAuth hash after session is established
    if (session && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      logger.debug('[Supabase] Cleaned OAuth hash from URL after session established');
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    hydrateUserFromSession(user, session?.user || null);
    // Clean up OAuth hash on auth state change
    if (session && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      logger.debug('[Supabase] Cleaned OAuth hash from URL on auth state change');
    }
  });
  const signInWithOAuth = async (
    provider: OAuthProvider,
    options?: { skipBrowserRedirect?: boolean; redirectTo?: string }
  ) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        skipBrowserRedirect: options?.skipBrowserRedirect,
        redirectTo: options?.redirectTo || window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  };
  const signOut = async () => {
    // Clear game progress from localStorage to prevent cross-user contamination
    // This prevents User A's data from being migrated to User B's account
    if (typeof window !== 'undefined') {
      logger.debug('[Supabase] Clearing game progress localStorage on logout');
      localStorage.removeItem(STORAGE_KEYS.progress);
      // Keep UI preferences (user store) but you may want to clear user-specific data
      // localStorage.removeItem("user"); // Uncomment if user data should also be cleared
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };
  return {
    provide: {
      supabase: {
        client: supabase,
        user,
        isOfflineMode: false,
        signInWithOAuth,
        signOut,
      },
    },
  };
});
