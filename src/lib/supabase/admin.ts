import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client with service role key.
 * Handles URL cleanup (strips /rest/v1/ if present).
 * Use this in ALL API routes.
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function getAdminClient() {
  if (!isSupabaseConfigured()) {
    return new Proxy({} as any, {
      get(target, prop) {
        if (prop === 'auth') {
          return {
            getUser: async () => ({ data: { user: null }, error: null }),
            admin: {
              getUserById: async () => ({ data: null, error: null }),
              updateUserById: async () => ({ data: null, error: null }),
              createUser: async () => ({ data: null, error: null }),
              listUsers: async () => ({ data: { users: [] }, error: null }),
            }
          };
        }
        return () => ({
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({ data: null, error: null }),
                order: async () => ({ data: [], error: null }),
                maybeSingle: async () => ({ data: null, error: null }),
              }),
              single: async () => ({ data: null, error: null }),
              order: async () => ({ data: [], error: null }),
              maybeSingle: async () => ({ data: null, error: null }),
            }),
            order: async () => ({ data: [], error: null }),
            maybeSingle: async () => ({ data: null, error: null }),
          }),
          insert: async () => ({ data: null, error: null }),
          update: async () => ({ data: null, error: null }),
          delete: async () => ({ data: null, error: null }),
        });
      },
    });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  // Strip any trailing paths like /rest/v1/ or /rest/v1/anything
  url = url.replace(/\/rest\/v1\/?.*$/, '').replace(/\/$/, '');

  if (!url || !url.startsWith('https://')) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured correctly');
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
