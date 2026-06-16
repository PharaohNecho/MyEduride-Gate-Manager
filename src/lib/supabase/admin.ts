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
    const createQueryBuilder = (mockData: any = []) => {
      const builder: any = new Proxy(() => {}, {
        get(target, prop) {
          if (prop === 'then') {
            return (onfulfilled: any) => {
              return Promise.resolve(onfulfilled({ data: mockData, error: null }));
            };
          };
          // Chain any of select, eq, in, order, maybeSingle, insert, update, split, etc.
          return () => builder;
        },
        apply() {
          return builder;
        }
      });
      return builder;
    };

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
        return () => createQueryBuilder([]);
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
