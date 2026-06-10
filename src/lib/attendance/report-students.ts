import { SupabaseClient } from '@supabase/supabase-js';

export async function fetchReportStudents(
  supabase: SupabaseClient,
  schoolId: string,
  options: { studentIds: string[] | null; classId: string | null }
) {
  try {
    let query = supabase
      .from('students')
      .select(`
        id,
        student_id_number,
        first_name,
        last_name,
        class_id,
        photo_url,
        classes:classes(name)
      `)
      .eq('school_id', schoolId)
      .eq('is_active', true);

    if (options.studentIds != null) {
      if (options.studentIds.length === 0) {
        return { students: [] };
      }
      query = query.in('id', options.studentIds);
    }

    if (options.classId) {
      query = query.eq('class_id', options.classId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[fetchReportStudents] Error fetching students:', error);
      return { students: [], error: error.message };
    }

    const students = (data || []).map((s: any) => ({
      id: s.id,
      student_id_number: s.student_id_number || '',
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      class_id: s.class_id || '',
      class_name: s.classes?.name || 'Unassigned',
      photo_url: s.photo_url || null,
    }));

    return { students };
  } catch (err: any) {
    console.error('[fetchReportStudents] Exception:', err);
    return { students: [], error: err?.message || 'Unknown error' };
  }
}
