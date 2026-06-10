import { SupabaseClient } from '@supabase/supabase-js';

export async function findProfileByUsername(supabase: SupabaseClient, username: string) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, username, email, full_name, failed_login_attempts, locked_until')
      .eq('username', username.toLowerCase().trim())
      .maybeSingle();

    return { data, error };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
