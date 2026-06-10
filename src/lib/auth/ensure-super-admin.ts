import { SupabaseClient } from '@supabase/supabase-js';

export async function ensureSuperAdminAccess(supabase: SupabaseClient, username: string) {
  try {
    const normUsername = username.toLowerCase().trim();
    
    // 1. Check if user profile already exists
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('username', normUsername)
      .maybeSingle();

    if (profileCheckError) {
      console.error('[ensureSuperAdminAccess] Error checking profile:', profileCheckError);
    }

    if (existingProfile) {
      // Profile exists, verify they have the super_admin role
      const { data: role, error: roleCheckError } = await supabase
        .from('user_school_roles')
        .select('id')
        .eq('user_id', existingProfile.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (roleCheckError) {
        console.error('[ensureSuperAdminAccess] Error checking role:', roleCheckError);
      }

      if (!role) {
        // Assign super_admin role
        const { error: insertRoleError } = await supabase
          .from('user_school_roles')
          .insert([
            {
              user_id: existingProfile.id,
              role: 'super_admin',
              school_id: null,
              is_active: true,
            },
          ]);
        if (insertRoleError) {
          console.error('[ensureSuperAdminAccess] Error inserting role:', insertRoleError);
          return { ok: false, error: insertRoleError.message };
        }
      }
      return { ok: true };
    }

    // 2. Profile does not exist, bootstrap a new super_admin account
    const email = `${normUsername}@myeduride.com`;
    const password = 'AdminPassword123!';
    let userId: string;

    // Check if auth user already exists in Supabase
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('[ensureSuperAdminAccess] Error listing auth users:', listError);
    }

    const existingUser = (userList?.users || []).find((u) => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new Auth User
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { login_password: password },
      });

      if (createError) {
        console.error('[ensureSuperAdminAccess] Error creating auth user:', createError);
        return { ok: false, error: createError.message };
      }

      userId = newUser.user!.id;
    }

    // Create user profile
    const { error: insertProfileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          username: normUsername,
          email,
          full_name: 'Platform Super Administrator',
        },
      ]);

    if (insertProfileError) {
      console.error('[ensureSuperAdminAccess] Error inserting profile:', insertProfileError);
      return { ok: false, error: insertProfileError.message };
    }

    // Create user role
    const { error: insertRoleError } = await supabase
      .from('user_school_roles')
      .insert([
        {
          user_id: userId,
          role: 'super_admin',
          school_id: null,
          is_active: true,
        },
      ]);

    if (insertRoleError) {
      console.error('[ensureSuperAdminAccess] Error inserting role for new user:', insertRoleError);
      return { ok: false, error: insertRoleError.message };
    }

    console.log(`[ensureSuperAdminAccess] Successfully bootstrapped super admin username="${normUsername}" email="${email}"`);
    return { ok: true };
  } catch (err: any) {
    console.error('[ensureSuperAdminAccess] Unhandled exception:', err);
    return { ok: false, error: err?.message || 'Unknown exception' };
  }
}
