import { SupabaseClient } from '@supabase/supabase-js';

export async function countSchoolParentsOnFile(supabase: SupabaseClient, schoolId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_school_roles')
      .select('user_id', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('role', 'parent')
      .eq('is_active', true);

    if (error) {
      console.error('[countSchoolParentsOnFile] Error counting parents:', error);
      return 0;
    }
    return count || 0;
  } catch (err) {
    console.error('[countSchoolParentsOnFile] Exception counting parents:', err);
    return 0;
  }
}
