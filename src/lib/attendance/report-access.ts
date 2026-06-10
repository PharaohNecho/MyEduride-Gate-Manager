import { SupabaseClient } from '@supabase/supabase-js';

export async function resolveReportCapabilities(
  supabase: SupabaseClient,
  session: any,
  requestedSchoolId: string | null
) {
  if (!session) return { error: 'Not authenticated' };

  const isSuperAdmin = session.roles.some((r: any) => r.role === 'super_admin');
  
  // Determine target school ID
  let targetSchoolId = requestedSchoolId;
  if (!targetSchoolId) {
    targetSchoolId = session.primary_school?.id || session.roles[0]?.school_id || null;
  }

  if (!targetSchoolId && !isSuperAdmin) {
    return { error: 'school_id required' };
  }

  // Check role within target school
  const schoolRole = session.roles.find(
    (r: any) => r.school_id === targetSchoolId || (isSuperAdmin && r.role === 'super_admin')
  );

  if (!isSuperAdmin && !schoolRole) {
    return { error: 'Access denied: You are not associated with this school' };
  }

  const role = isSuperAdmin ? 'super_admin' : schoolRole.role;

  let canStaffReports = false;
  let canStudentReports = false;
  let studentIds: string[] | null = null;
  let staffUserIds: string[] | null = null;

  if (role === 'super_admin' || role === 'school_admin') {
    canStaffReports = true;
    canStudentReports = true;
  } else if (role === 'teacher') {
    canStudentReports = true;
    try {
      // Find classes taught by this teacher
      const { data: classData } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', session.user_id)
        .eq('school_id', targetSchoolId);
      
      const classIds = (classData || []).map((c: any) => c.id);
      
      if (classIds.length > 0) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .in('class_id', classIds)
          .eq('school_id', targetSchoolId);
          
        studentIds = (studentData || []).map((s: any) => s.id);
      } else {
        studentIds = [];
      }
    } catch (e) {
      console.error('[report-access] Error fetching teacher student scope:', e);
      studentIds = [];
    }
  }

  return {
    schoolId: targetSchoolId!,
    canStaffReports,
    canStudentReports,
    studentIds,
    staffUserIds,
  };
}
