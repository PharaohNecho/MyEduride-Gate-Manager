import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  if (typeof window === 'undefined') {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    const createQueryBuilder = (mockData: any = []) => {
      const builder: any = new Proxy(() => {}, {
        get(target, prop) {
          if (prop === 'then') {
            return (onfulfilled: any) => {
              return Promise.resolve(onfulfilled({ data: mockData, error: null }));
            };
          };
          // Chain any of select, eq, in, order, maybeSingle, insert, etc.
          return () => builder;
        },
        apply() {
          return builder;
        }
      });
      return builder;
    };

    // Return a mocked/safe client so it doesn't crash on load
    return new Proxy({} as any, {
      get(target, prop) {
        if (prop === 'auth') {
          return {
            getSession: async () => ({ data: { session: null }, error: null }),
            getUser: async () => ({ data: { user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          };
        }
        return () => createQueryBuilder([]);
      },
    });
  }

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  url = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  return createBrowserClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
