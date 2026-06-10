import { SupabaseClient } from '@supabase/supabase-js';

export interface UserSchoolRoleRaw {
  school_id: string | null;
  role: string;
  is_active: boolean;
}

export async function getActiveSchoolRoles(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSchoolRoleRaw[]> {
  try {
    const { data, error } = await supabase
      .from('user_school_roles')
      .select('school_id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('[getActiveSchoolRoles] Error fetching roles:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[getActiveSchoolRoles] Exception in getActiveSchoolRoles:', err);
    return [];
  }
}

export function userHasRoleAtSchool(roles: UserSchoolRoleRaw[], schoolId: string): boolean {
  if (!roles || roles.length === 0 || !schoolId) return false;
  return roles.some((r) => r.school_id === schoolId);
}
