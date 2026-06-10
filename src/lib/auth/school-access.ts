export function canViewSchoolDashboard(session: any, schoolId: string): boolean {
  if (!session) return false;
  if (session.roles?.some((r: any) => r.role === 'super_admin')) return true;
  return session.roles?.some((r: any) => r.school_id === schoolId) ?? false;
}

export function canListSchoolStudents(session: any, schoolId: string): boolean {
  if (!session) return false;
  if (session.roles?.some((r: any) => r.role === 'super_admin')) return true;
  return session.roles?.some((r: any) => r.school_id === schoolId) ?? false;
}

export function canViewSchoolCustomFields(session: any, schoolId: string): boolean {
  if (!session) return false;
  if (session.roles?.some((r: any) => r.role === 'super_admin')) return true;
  return session.roles?.some((r: any) => r.school_id === schoolId && ['school_admin', 'super_admin'].includes(r.role)) ?? false;
}

export async function canViewStudentPickupPersons(supabase: any, session: any, studentId: string): Promise<boolean> {
  if (!session) return false;
  const isSuperAdmin = session.roles?.some((r: any) => r.role === 'super_admin');
  if (isSuperAdmin) return true;

  const { data: parentLink } = await supabase
    .from('student_parents')
    .select('id')
    .eq('student_id', studentId)
    .eq('parent_user_id', session.user_id)
    .maybeSingle();

  if (parentLink) return true;

  const { data: student } = await supabase
    .from('students')
    .select('school_id')
    .eq('id', studentId)
    .maybeSingle();

  if (student?.school_id) {
    return session.roles?.some(
      (r: any) => r.school_id === student.school_id && ['school_admin', 'gate_officer', 'teacher'].includes(r.role)
    ) ?? false;
  }

  return false;
}

export async function canListSchoolPickupPersons(supabase: any, session: any, schoolId: string): Promise<boolean> {
  if (!session) return false;
  if (session.roles?.some((r: any) => r.role === 'super_admin')) return true;
  return session.roles?.some(
    (r: any) => r.school_id === schoolId && ['school_admin', 'gate_officer', 'teacher'].includes(r.role)
  ) ?? false;
}

