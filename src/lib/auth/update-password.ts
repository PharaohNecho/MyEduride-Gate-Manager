import { SupabaseClient } from '@supabase/supabase-js';

export async function setAuthPasswordForProfile(
  supabase: SupabaseClient,
  userId: string,
  password: string,
  options: { createAuthIfMissing?: boolean } = {}
) {
  try {
    const { data: profile, error: profileErr } = await supabase
      .from('user_profiles')
      .select('username, email')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile) {
      return { error: 'User not found' };
    }

    const email = profile.email || `${profile.username}@myeduride.com`;

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      user_metadata: { login_password: password },
    });

    if (error) {
      console.error('[setAuthPasswordForProfile] Update user error:', error.message);
      
      if (options.createAuthIfMissing && /not found|invalid/i.test(error.message)) {
        console.log('[setAuthPasswordForProfile] User not found in Auth. Re-creating auth with ID:', userId);
        const { error: createErr } = await supabase.auth.admin.createUser({
          id: userId,
          email,
          password,
          email_confirm: true,
          user_metadata: { login_password: password },
        });
        
        if (createErr) {
          console.error('[setAuthPasswordForProfile] Error re-creating auth:', createErr);
          return { error: createErr.message };
        }
        return { ok: true };
      }
      
      return { error: error.message };
    }

    return { ok: true };
  } catch (err: any) {
    console.error('[setAuthPasswordForProfile] Exception updating password:', err);
    return { error: err?.message || 'Operation failed' };
  }
}
