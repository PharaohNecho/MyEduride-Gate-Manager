import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import {
  canListSchoolStudents,
  canViewSchoolCustomFields,
  canViewSchoolDashboard,
} from '@/lib/auth/school-access';
import { ATTENDANCE_UI_NOTE } from '@/lib/attendance/window';
import { todayInLagos, lagosDayBounds } from '@/lib/timezone';
import { getSessionFromRequest } from '@/lib/session';
import { countSchoolParentsOnFile } from '@/lib/school/school-parents-list';

export async function POST(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { action, params } = await request.json();
    console.log('[DATA API] action:', action, 'user:', session.user_id);

    if (!isSupabaseConfigured()) {
      switch (action) {
        case 'get_school_admin_data':
          return NextResponse.json({
            school_id: 'demo-school-id',
            school: {
              id: 'demo-school-id',
              name: 'MyEduRide Prototype Academy',
              logo_url: null,
              welcome_message: 'Welcome to MyEduRide Prototype Academy!',
              status: 'approved',
              approval_status: 'approved',
              setup_completed: true,
              setup_step: 'complete'
            }
          });
        case 'get_school_dashboard':
          return NextResponse.json({
            total_students: 124,
            total_teachers: 18,
            total_parents: 189,
            present_today: 94,
            late_today: 12,
            absent_today: 18,
            recent_activity: [
              {
                id: 'act-1',
                timestamp: new Date(Date.now() - 3000).toISOString(),
                status: 'present',
                type: 'arrival',
                student: {
                  first_name: 'Samuel',
                  last_name: 'Okon',
                  photo_url: null,
                  student_id_number: 'MER-1049'
                }
              },
              {
                id: 'act-2',
                timestamp: new Date(Date.now() - 9000).toISOString(),
                status: 'late',
                type: 'arrival',
                student: {
                  first_name: 'Amara',
                  last_name: 'Eze',
                  photo_url: null,
                  student_id_number: 'MER-2940'
                }
              },
              {
                id: 'act-3',
                timestamp: new Date(Date.now() - 18000).toISOString(),
                status: 'present',
                type: 'arrival',
                student: {
                  first_name: 'Chinedu',
                  last_name: 'Obi',
                  photo_url: null,
                  student_id_number: 'MER-4012'
                }
              },
              {
                id: 'act-4',
                timestamp: new Date(Date.now() - 24000).toISOString(),
                status: 'present',
                type: 'arrival',
                student: {
                  first_name: 'Amina',
                  last_name: 'Yusuf',
                  photo_url: null,
                  student_id_number: 'MER-7319'
                }
              }
            ],
            attendance_ui_note: 'Sandbox Demo Mode Activated'
          });
        case 'get_teacher_dashboard':
          return NextResponse.json({
            school_id: 'demo-school-id',
            students: [
              { id: 'stu-1', first_name: 'Samuel', last_name: 'Okon', student_id_number: 'MER-1049', class_name: 'Grade 5 Gold', present: true, late: false, arrival_time: new Date(Date.now() - 300000).toISOString() },
              { id: 'stu-2', first_name: 'Amara', last_name: 'Eze', student_id_number: 'MER-2940', class_name: 'Grade 5 Gold', present: true, late: true, arrival_time: new Date(Date.now() - 900000).toISOString() },
              { id: 'stu-3', first_name: 'Chinedu', last_name: 'Obi', student_id_number: 'MER-4012', class_name: 'Grade 5 Gold', present: false, late: false, arrival_time: null },
              { id: 'stu-4', first_name: 'Amina', last_name: 'Yusuf', student_id_number: 'MER-7319', class_name: 'Grade 5 Gold', present: true, late: false, arrival_time: new Date(Date.now() - 2400000).toISOString() }
            ]
          });
        case 'get_students':
          return NextResponse.json({
            students: [
              { id: 'stu-1', first_name: 'Samuel', last_name: 'Okon', student_id_number: 'MER-1049', class_name: 'Grade 5 Gold', is_active: true },
              { id: 'stu-2', first_name: 'Amara', last_name: 'Eze', student_id_number: 'MER-2940', class_name: 'Grade 5 Gold', is_active: true },
              { id: 'stu-3', first_name: 'Chinedu', last_name: 'Obi', student_id_number: 'MER-4012', class_name: 'Grade 5 Gold', is_active: true },
              { id: 'stu-4', first_name: 'Amina', last_name: 'Yusuf', student_id_number: 'MER-7319', class_name: 'Grade 5 Gold', is_active: true }
            ]
          });
        case 'get_classes':
          return NextResponse.json({
            classes: [
              { id: 'cls-1', name: 'Grade 5 Gold', grade: '5', is_active: true, students_count: 4, teacher: { full_name: 'Mrs. Chioma Nwachukwu' } },
              { id: 'cls-2', name: 'Grade 4 Silver', grade: '4', is_active: true, students_count: 8, teacher: { full_name: 'Mr. Babajide Alao' } }
            ]
          });
        case 'get_custom_fields':
          return NextResponse.json({
            fields: []
          });
        case 'get_staff_dashboard':
          return NextResponse.json({
            attendance: []
          });
        case 'get_parent_children':
          return NextResponse.json({
            children: [
              { id: 'stu-1', first_name: 'Samuel', last_name: 'Okon', student_id_number: 'MER-1049', class_name: 'Grade 5 Gold', school: { name: 'MyEduRide Prototype Academy' } }
            ]
          });
        case 'get_teacher_dashboard_full':
          return NextResponse.json({
            students: [
              { id: 'stu-1', first_name: 'Samuel', last_name: 'Okon', student_id_number: 'MER-1049', class_name: 'Grade 5 Gold', present: true, late: false, arrival_time: new Date(Date.now() - 300000).toISOString() },
              { id: 'stu-2', first_name: 'Amara', last_name: 'Eze', student_id_number: 'MER-2940', class_name: 'Grade 5 Gold', present: true, late: true, arrival_time: new Date(Date.now() - 900000).toISOString() },
              { id: 'stu-3', first_name: 'Chinedu', last_name: 'Obi', student_id_number: 'MER-4012', class_name: 'Grade 5 Gold', present: false, late: false, arrival_time: null },
              { id: 'stu-4', first_name: 'Amina', last_name: 'Yusuf', student_id_number: 'MER-7319', class_name: 'Grade 5 Gold', present: true, late: false, arrival_time: new Date(Date.now() - 2400000).toISOString() }
            ],
            teacher_name: 'Mrs. Chioma Nwachukwu',
            school_name: 'MyEduRide Prototype Academy',
            attendance_stats: {
              present_today: 3,
              absent_today: 1,
              late_today: 1
            }
          });
        case 'get_parent_notifications':
          return NextResponse.json({
            notifications: []
          });
        case 'mark_notification_read':
          return NextResponse.json({
            success: true
          });
        case 'get_current_profile':
          return NextResponse.json({
            profile: {
              id: session.user_id,
              username: session.username,
              full_name: session.full_name,
              email: session.email,
              title: session.title || 'Guardian',
              photo_url: session.photo_url || null,
            }
          });
        case 'save_school_template':
          return NextResponse.json({
            success: true
          });
        case 'get_school_template':
          return NextResponse.json({
            success: true,
            template: null
          });
        default:
          return NextResponse.json({ error: 'Sandbox Mode: Action not simulated' }, { status: 400 });
      }
    }

    
    const supabase = getAdminClient();

    const withTimeout = <T>(promise: PromiseLike<T>, ms = 10000): Promise<T> => {
      return Promise.race([
        Promise.resolve(promise),
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Query timeout')), ms)),
      ]);
    };

    switch (action) {
      case 'get_school_admin_data': {
        const requestedRole = params?.role || 'school_admin';
        if (!session.roles.some((r: { role: string }) => r.role === requestedRole)) {
          return NextResponse.json(
            { error: 'Access denied', school: null, school_id: null },
            { status: 403 }
          );
        }
        const { data: role } = (await withTimeout(
          supabase.from('user_school_roles').select('school_id')
            .eq('user_id', session.user_id).eq('role', requestedRole).eq('is_active', true).limit(1).single(),
          8000
        ).catch(() => ({ data: null }))) as any;
        if (!role) return NextResponse.json({ error: 'No school found', school: null, school_id: null }, { status: 200 });
        const { data: school } = (await withTimeout(supabase.from('schools').select('*').eq('id', role.school_id).single(), 8000).catch(() => ({ data: null }))) as any;
        return NextResponse.json({ school, school_id: role.school_id });
      }

      case 'get_school_dashboard': {
        let schoolId = params?.school_id;
        if (!schoolId) {
          const { data: role } = (await withTimeout(
            supabase.from('user_school_roles').select('school_id')
              .eq('user_id', session.user_id).eq('role', 'school_admin').eq('is_active', true).limit(1).single(),
            8000
          ).catch(() => ({ data: null }))) as any;
          if (role) {
            schoolId = role.school_id;
          }
        }
        if (!schoolId) return NextResponse.json({ error: 'school_id required' }, { status: 400 });
        if (!canViewSchoolDashboard(session, schoolId)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        const { startIso, endIso } = lagosDayBounds();

        const [
          schoolRes,
          studentsRes,
          teachersRes,
          totalParents,
          liveAttendanceRes,
          recentActivityRes
        ] = await Promise.all([
          supabase.from('schools').select('name').eq('id', schoolId).single(),
          supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('is_active', true),
          supabase.from('user_school_roles').select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('role', 'teacher').eq('is_active', true),
          countSchoolParentsOnFile(supabase, schoolId),
          supabase.from('attendance_records')
            .select('student_id, status')
            .eq('school_id', schoolId)
            .eq('type', 'arrival')
            .gte('timestamp', startIso)
            .lte('timestamp', endIso),
          supabase.from('attendance_records')
            .select('*, student:students(first_name, last_name, photo_url, student_id_number)')
            .eq('school_id', schoolId)
            .order('timestamp', { ascending: false })
            .limit(10)
        ]);

        const school = schoolRes.data;
        const totalStudents = studentsRes.count;
        const totalTeachers = teachersRes.count;
        const liveAttendance = liveAttendanceRes.data;
        const recentActivity = recentActivityRes.data;

        const uniquePresent = new Set((liveAttendance || []).map((a: any) => a.student_id));
        return NextResponse.json({
          school_id: schoolId,
          school_name: school?.name || '',
          school: school || null,
          total_students: totalStudents || 0,
          total_teachers: totalTeachers || 0,
          total_parents: totalParents,
          present_today: uniquePresent.size,
          late_today: liveAttendance?.filter((a: any) => a.status === 'late').length || 0,
          absent_today: Math.max(0, (totalStudents || 0) - uniquePresent.size),
          recent_activity: recentActivity || [],
          attendance_ui_note: ATTENDANCE_UI_NOTE,
        });
      }

      case 'get_teacher_dashboard': {
        const { data: role } = await supabase
          .from('user_school_roles')
          .select('school_id')
          .eq('user_id', session.user_id)
          .eq('role', 'teacher')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!role?.school_id) {
          return NextResponse.json({ error: 'No teacher school', students: [], present_count: 0, absent_count: 0 });
        }

        const schoolId = role.school_id;
        const [schoolRes, teacherProfileRes] = await Promise.all([
          supabase.from('schools').select('name').eq('id', schoolId).single(),
          supabase.from('teacher_profiles')
            .select('id')
            .eq('user_id', session.user_id)
            .eq('school_id', schoolId)
            .maybeSingle()
        ]);

        const school = schoolRes.data;
        const teacherProfile = teacherProfileRes.data;

        let classIds: string[] = [];
        if (teacherProfile?.id) {
          const { data: assignments } = await supabase
            .from('teacher_class_assignments')
            .select('class_id')
            .eq('teacher_profile_id', teacherProfile.id);
          classIds = (assignments || []).map((a: { class_id: string }) => a.class_id);
          if (classIds.length === 0) {
            const { data: directClasses } = await supabase
              .from('school_classes')
              .select('id')
              .eq('assigned_teacher_id', teacherProfile.id)
              .eq('school_id', schoolId)
              .eq('is_active', true);
            classIds = (directClasses || []).map((c: { id: string }) => c.id);
          }
        }

        let studentsQuery = supabase
          .from('students')
          .select('*, class:school_classes(name, grade)')
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .order('last_name');

        if (classIds.length > 0) {
          studentsQuery = studentsQuery.in('class_id', classIds);
        }

        const { data: students } = await studentsQuery;

        const { startIso, endIso } = lagosDayBounds();

        const studentIds = (students || []).map((s: { id: string }) => s.id);
        let arrivals: { student_id: string; status: string; timestamp: string; type: string }[] = [];

        if (studentIds.length > 0) {
          const { data: records } = await supabase
            .from('attendance_records')
            .select('student_id, status, timestamp, type')
            .eq('school_id', schoolId)
            .in('student_id', studentIds)
            .eq('type', 'arrival')
            .gte('timestamp', startIso)
            .lte('timestamp', endIso)
            .order('timestamp', { ascending: false });

          const seen = new Set<string>();
          for (const r of records || []) {
            if (!seen.has(r.student_id)) {
              seen.add(r.student_id);
              arrivals.push(r);
            }
          }
        }

        const arrivalMap = new Map(arrivals.map((a) => [a.student_id, a]));

        const enriched = (students || []).map((s: { id: string }) => {
          const arrival = arrivalMap.get(s.id);
          return {
            ...s,
            present: !!arrival,
            late: arrival?.status === 'late',
            arrival_time: arrival?.timestamp || null,
          };
        });

        return NextResponse.json({
          school_id: schoolId,
          school,
          class_ids: classIds,
          students: enriched,
          present_count: enriched.filter((s: { present: boolean }) => s.present).length,
          absent_count: enriched.filter((s: { present: boolean }) => !s.present).length,
          late_count: enriched.filter((s: { late: boolean }) => s.late).length,
          attendance_ui_note: ATTENDANCE_UI_NOTE,
        });
      }

      case 'get_students': {
        const schoolId = params?.school_id;
        if (!schoolId) {
          return NextResponse.json({ error: 'school_id required', students: [] }, { status: 400 });
        }
        if (!canListSchoolStudents(session, schoolId)) {
          return NextResponse.json({ error: 'Access denied', students: [] }, { status: 403 });
        }
        const { data } = await supabase
          .from('students')
          .select('*, class:school_classes(name, grade)')
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .order('last_name');
        return NextResponse.json({ students: data || [] });
      }

      case 'get_classes': {
        const schoolId = params?.school_id;
        if (!schoolId) {
          return NextResponse.json({ error: 'school_id required', classes: [] }, { status: 400 });
        }

        const canAccess = session.roles.some(
          (r: { role: string; school_id?: string }) =>
            r.role === 'super_admin' ||
            ((r.role === 'school_admin' || r.role === 'teacher' || r.role === 'gate_officer') && r.school_id === schoolId)
        );

        if (!canAccess) {
          return NextResponse.json({ error: 'Access denied', classes: [] }, { status: 403 });
        }

        const { data, error } = await supabase
          .from('school_classes')
          .select('*')
          .eq('school_id', schoolId)
          .order('name', { ascending: true });

        if (error) {
          console.error('[DATA API] get_classes:', error.message);
          return NextResponse.json({ error: error.message, classes: [] }, { status: 500 });
        }

        const rows = data || [];
        const classIds = rows.map((c: { id: string }) => c.id);
        const studentCounts: Record<string, number> = {};

        if (classIds.length > 0) {
          const { data: students } = await supabase
            .from('students')
            .select('class_id')
            .eq('school_id', schoolId)
            .in('class_id', classIds)
            .eq('is_active', true);

          for (const s of students || []) {
            studentCounts[s.class_id] = (studentCounts[s.class_id] || 0) + 1;
          }
        }

        const classes = rows
          .filter((c: { is_active?: boolean | null }) => c.is_active !== false)
          .map((c: { id: string }) => ({
            ...c,
            student_count: studentCounts[c.id] || 0,
          }));

        return NextResponse.json({ classes });
      }

      case 'get_custom_fields': {
        const schoolId = params?.school_id;
        if (!schoolId) {
          return NextResponse.json({ error: 'school_id required', fields: [] }, { status: 400 });
        }
        if (!canViewSchoolCustomFields(session, schoolId)) {
          return NextResponse.json({ error: 'Access denied', fields: [] }, { status: 403 });
        }
        const { data } = await supabase
          .from('school_custom_fields')
          .select('*')
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .order('sort_order');
        return NextResponse.json({ fields: data || [] });
      }

      case 'get_staff_dashboard': {
        const { data: role } = await supabase
          .from('user_school_roles')
          .select('school_id')
          .eq('user_id', session.user_id)
          .eq('role', 'staff')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!role?.school_id) {
          return NextResponse.json({ error: 'No staff school' }, { status: 403 });
        }

        const schoolId = role.school_id;
        const { data: school } = await supabase.from('schools').select('name').eq('id', schoolId).single();

        let jobTitle = 'Staff';
        const { data: profile } = await supabase
          .from('teacher_profiles')
          .select('custom_role:school_custom_roles(name)')
          .eq('user_id', session.user_id)
          .eq('school_id', schoolId)
          .maybeSingle();

        const custom = profile?.custom_role as unknown;
        let customName: string | undefined;
        if (Array.isArray(custom)) customName = (custom[0] as { name?: string })?.name;
        else if (custom && typeof custom === 'object') customName = (custom as { name?: string }).name;
        if (customName) jobTitle = customName;

        return NextResponse.json({
          school_id: schoolId,
          school_name: school?.name || '',
          job_title: jobTitle,
        });
      }

      case 'get_parent_children': {
        const { data: links } = await supabase
          .from('student_parents')
          .select('student_id, relationship, is_primary')
          .eq('parent_user_id', session.user_id);

        if (!links?.length) {
          return NextResponse.json({ children: [] });
        }

        const ids = links.map((l: any) => l.student_id);
        const { data: students } = await supabase
          .from('students')
          .select('*, class:school_classes(name, grade), school:schools(name, primary_color, logo_url)')
          .in('id', ids)
          .eq('is_active', true);

        const children = (students || []).map((s: any) => ({
          ...s,
          relationship: links.find((l: any) => l.student_id === s.id)?.relationship || 'parent',
        }));

        return NextResponse.json({ children });
      }

      case 'create_dismissal_request': {
        const { student_id, school_id, pickup_person_name, relationship, dismissal_date } = params;

        if (!student_id || !pickup_person_name) {
          return NextResponse.json({ error: 'student_id and pickup_person_name are required' }, { status: 400 });
        }

        const serializedNotes = JSON.stringify({
          pickup_person_name,
          relationship: relationship || 'Guardian',
          pickup_person_phone: params.pickup_person_phone || ''
        });

        // Check if a dismissal request already exists for the student and date
        const { data: existingRequest, error: findError } = await supabase
          .from('dismissal_requests')
          .select('*')
          .eq('student_id', student_id)
          .eq('dismissal_date', dismissal_date)
          .maybeSingle();

        if (findError) {
          console.error('[create_dismissal_request] DB find error:', findError);
        }

        let requestData, insertError;

        if (existingRequest) {
          if (existingRequest.status !== 'pending') {
            return NextResponse.json({ 
              error: `A dismissal request has already been ${existingRequest.status} for this student today.` 
            }, { status: 400 });
          }

          // Update the existing pending request with new pickup parent / details
          const { data, error } = await supabase
            .from('dismissal_requests')
            .update({
              requested_by_user_id: session.user_id,
              notes: serializedNotes,
              created_at: new Date().toISOString()
            })
            .eq('id', existingRequest.id)
            .select()
            .maybeSingle();

          requestData = data;
          insertError = error;
        } else {
          // Insert a new request into database
          const { data, error } = await supabase
            .from('dismissal_requests')
            .insert({
              student_id,
              school_id: school_id || 'demo-school-id',
              requested_by_user_id: session.user_id,
              notes: serializedNotes,
              status: 'pending',
              dismissal_date,
              created_at: new Date().toISOString()
            })
            .select()
            .maybeSingle();

          requestData = data;
          insertError = error;
        }

        if (insertError) {
          console.error('[create_dismissal_request] DB save error:', insertError);
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        let returnedData = requestData;
        if (returnedData && returnedData.notes) {
          try {
            const parsed = JSON.parse(returnedData.notes);
            returnedData = {
              ...returnedData,
              pickup_person_name: parsed.pickup_person_name,
              relationship: parsed.relationship,
              pickup_person_phone: parsed.pickup_person_phone
            };
          } catch (e) {
            console.error('Failed to parse notes on create:', e);
          }
        }

        // Get student & school details for email
        const { data: student } = await supabase
          .from('students')
          .select('first_name, last_name, school_id, school:schools(name, primary_color)')
          .eq('id', student_id)
          .maybeSingle();

        const studentName = student ? `${student.first_name} ${student.last_name}` : 'Student';
        const schoolObj = student?.school ? (Array.isArray(student.school) ? student.school[0] : student.school) : null;
        const schoolName = schoolObj?.name || 'MyEduRide Academy';
        const schoolColor = schoolObj?.primary_color || '#10b981';

        // Get all unique emails to notify (including the user session and any linked parent profiles)
        const emailsToNotify = new Set<string>();
        if (session.email) {
          emailsToNotify.add(session.email);
        }

        try {
          const { data: pLinks } = await supabase
            .from('student_parents')
            .select('parent_user_id')
            .eq('student_id', student_id);
          
          if (pLinks && pLinks.length > 0) {
            const pIds = pLinks.map((l: any) => l.parent_user_id);
            const { data: parentProfiles } = await supabase
              .from('user_profiles')
              .select('email')
              .in('id', pIds);
            
            if (parentProfiles) {
              parentProfiles.forEach((p: any) => {
                if (p.email) emailsToNotify.add(p.email);
              });
            }
          }
        } catch (dbErr) {
          console.error('[create_dismissal_request] Failed finding parent emails:', dbErr);
        }

        let emailSent = false;

        if (emailsToNotify.size > 0 && process.env.RESEND_API_KEY) {
          try {
            const resend = new Resend(process.env.RESEND_API_KEY);
            const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            const emailHtml = `
              <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                <div style="background: ${schoolColor}; padding: 24px; text-align: center; color: white;">
                  <h2 style="margin: 0; font-size: 18px; font-weight: 800;">MyEduRide Safety Portal</h2>
                  <p style="margin: 4px 0 0; font-size: 12px; opacity: 0.9;">Gate Dispatch Authorization</p>
                </div>
                <div style="padding: 24px; background: white;">
                  <h3 style="color: #111827; margin-top: 0; font-size: 16px; font-weight: 700;">Pickup Clearance Registered</h3>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">You have authorized a gate release clearance for today's school dismissal.</p>

                  <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #f3f4f6;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                      <tr>
                        <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">STUDENT</td>
                        <td style="color: #111827; padding: 4px 0; text-align: right; font-weight: 700;">${studentName}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">PICKUP PERSON</td>
                        <td style="color: #111827; padding: 4px 0; text-align: right; font-weight: 700; text-transform: capitalize;">${pickup_person_name}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">RELATIONSHIP</td>
                        <td style="color: #111827; padding: 4px 0; text-align: right; font-weight: 700; text-transform: capitalize;">${relationship}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">DATE</td>
                        <td style="color: #111827; padding: 4px 0; text-align: right; font-weight: 700;">${dateStr}</td>
                      </tr>
                      <tr>
                        <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">STATUS</td>
                        <td style="color: #059669; padding: 4px 0; text-align: right; font-weight: 750; text-transform: uppercase;">PENDING CLEARANCE</td>
                      </tr>
                    </table>
                  </div>

                  <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                    This email is an automated security receipt sent via MyEduRide Safety Portal.
                  </p>
                </div>
              </div>
            `;

            const recipientList = Array.from(emailsToNotify) as string[];
            for (const recipient of recipientList) {
              try {
                await resend.emails.send({
                  from: `${schoolName} via MyEduRide <noreply@assetid.site>`,
                  to: recipient,
                  subject: `Pickup Authorization registered for ${studentName}`,
                  html: emailHtml,
                });
                emailSent = true;
              } catch (domainErr: any) {
                console.warn(`[create_dismissal_request] Primary email domain failed for ${recipient}, retrying via onboarding@resend.dev:`, domainErr?.message || domainErr);
                try {
                  await resend.emails.send({
                    from: 'MyEduRide Gate <onboarding@resend.dev>',
                    to: recipient,
                    subject: `Pickup Authorization registered for ${studentName}`,
                    html: emailHtml,
                  });
                  emailSent = true;
                } catch (fallbackErr: any) {
                  console.error(`[create_dismissal_request] Direct fallback sending failed for ${recipient}:`, fallbackErr?.message || fallbackErr);
                }
              }
            }
          } catch (emailErr) {
            console.error('[create_dismissal_request] Resend Email error:', emailErr);
          }
        }

        return NextResponse.json({ success: true, dismissal: returnedData, email_sent: emailSent });
      }

      case 'get_teacher_dashboard_full': {
        // Extended teacher dashboard: includes dismissal status and extra lesson status for today
        const { data: role } = await supabase
          .from('user_school_roles')
          .select('school_id')
          .eq('user_id', session.user_id)
          .eq('role', 'teacher')
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();

        if (!role?.school_id) {
          return NextResponse.json({ error: 'No teacher school', students: [], present_count: 0, absent_count: 0 });
        }

        const schoolId = role.school_id;
        const [schoolRes, teacherProfileRes] = await Promise.all([
          supabase.from('schools').select('name').eq('id', schoolId).single(),
          supabase.from('teacher_profiles')
            .select('id')
            .eq('user_id', session.user_id)
            .eq('school_id', schoolId)
            .maybeSingle()
        ]);

        const school = schoolRes.data;
        const teacherProfile = teacherProfileRes.data;

        let classIds: string[] = [];
        if (teacherProfile?.id) {
          const { data: assignments } = await supabase
            .from('teacher_class_assignments')
            .select('class_id')
            .eq('teacher_profile_id', teacherProfile.id);
          classIds = (assignments || []).map((a: { class_id: string }) => a.class_id);
          if (classIds.length === 0) {
            const { data: directClasses } = await supabase
              .from('school_classes')
              .select('id')
              .eq('assigned_teacher_id', teacherProfile.id)
              .eq('school_id', schoolId)
              .eq('is_active', true);
            classIds = (directClasses || []).map((c: { id: string }) => c.id);
          }
        }

        let studentsQuery = supabase
          .from('students')
          .select('*, class:school_classes(name, grade)')
          .eq('school_id', schoolId)
          .eq('is_active', true)
          .order('last_name');

        if (classIds.length > 0) {
          studentsQuery = studentsQuery.in('class_id', classIds);
        }

        const { data: students } = await studentsQuery;
        const { startIso, endIso } = lagosDayBounds();
        const today = todayInLagos();
        const studentIds = (students || []).map((s: { id: string }) => s.id);

        const [recordsRes, dismissalsRes, extraLessonsRes] = await Promise.all([
          studentIds.length > 0 ? supabase
            .from('attendance_records')
            .select('student_id, status, timestamp, type')
            .eq('school_id', schoolId)
            .in('student_id', studentIds)
            .eq('type', 'arrival')
            .gte('timestamp', startIso)
            .lte('timestamp', endIso)
            .order('timestamp', { ascending: false })
            : Promise.resolve({ data: [] }),
          supabase
            .from('dismissal_requests')
            .select('student_id, status')
            .eq('school_id', schoolId)
            .in('student_id', studentIds.length > 0 ? studentIds : ['none'])
            .eq('dismissal_date', today),
          supabase
            .from('extra_lessons')
            .select('student_id, is_released, lesson_end_time')
            .eq('school_id', schoolId)
            .in('student_id', studentIds.length > 0 ? studentIds : ['none'])
            .eq('date', today)
        ]);

        const records = recordsRes.data || [];
        const dismissals = dismissalsRes.data || [];
        const extraLessons = extraLessonsRes.data || [];

        let arrivals: { student_id: string; status: string; timestamp: string; type: string }[] = [];
        const seen = new Set<string>();
        for (const r of records || []) {
          if (!seen.has(r.student_id)) {
            seen.add(r.student_id);
            arrivals.push(r);
          }
        }

        const arrivalMap = new Map(arrivals.map((a) => [a.student_id, a]));
        const dismissalMap = new Map((dismissals || []).map((d: any) => [d.student_id, d]));
        const extraLessonMap = new Map((extraLessons || []).map((e: any) => [e.student_id, e]));

        const enriched = (students || []).map((s: { id: string }) => {
          const arrival = arrivalMap.get(s.id) as any;
          const dismissal = dismissalMap.get(s.id) as any;
          const extraLesson = extraLessonMap.get(s.id) as any;
          return {
            ...s,
            present: !!arrival,
            late: arrival?.status === 'late',
            arrival_time: arrival?.timestamp || null,
            ready_for_pickup: !!dismissal && dismissal.status !== 'completed',
            dismissal_status: dismissal?.status || null,
            in_extra_lesson: !!extraLesson && !extraLesson.is_released,
            extra_lesson_end_time: extraLesson?.lesson_end_time || null,
          };
        });

        return NextResponse.json({
          school_id: schoolId,
          school,
          class_ids: classIds,
          students: enriched,
          present_count: enriched.filter((s: any) => s.present).length,
          absent_count: enriched.filter((s: any) => !s.present).length,
          late_count: enriched.filter((s: any) => s.late).length,
          ready_count: enriched.filter((s: any) => s.ready_for_pickup).length,
          extra_lesson_count: enriched.filter((s: any) => s.in_extra_lesson).length,
          attendance_ui_note: ATTENDANCE_UI_NOTE,
        });
      }

      case 'get_parent_notifications': {
        const { data, error } = await supabase
          .from('notifications')
          .select('*, student:students(first_name, last_name)')
          .eq('user_id', session.user_id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          return NextResponse.json({ notifications: [], error: error.message });
        }
        return NextResponse.json({ notifications: data || [] });
      }

      case 'mark_notification_read': {
        const notificationId = params?.notification_id;
        if (!notificationId) {
          return NextResponse.json({ error: 'notification_id required' }, { status: 400 });
        }
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId)
          .eq('user_id', session.user_id);
        return NextResponse.json({ success: true });
      }

      case 'record_attendance_scan': {
        const { student_id, staff_id, type, status, timestamp } = params;

        if (!student_id && !staff_id) {
          return NextResponse.json({ error: 'student_id or staff_id is required' }, { status: 400 });
        }

        const scanTime = timestamp || new Date().toISOString();
        const scanType = type || 'arrival'; // 'arrival' | 'departure'
        const scanStatus = status || 'on_time'; // 'on_time' | 'late' | 'normal'

        if (student_id) {
          // 1. Find school_id for this student
          const { data: student, error: studentErr } = await supabase
            .from('students')
            .select('school_id, first_name, last_name')
            .eq('id', student_id)
            .maybeSingle();

          if (studentErr || !student) {
            return NextResponse.json({ error: 'Student profile not registered in database' }, { status: 404 });
          }

          const schoolId = student.school_id || 'demo-school-id';

          // 2. Double Scan Check (Single check-in and check-out per school day)
          const dateStr = scanTime.substring(0, 10);
          const startOfDay = `${dateStr}T00:00:00.000Z`;
          const endOfDay = `${dateStr}T23:59:59.999Z`;

          const { data: existingStudentRecords } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('student_id', student_id)
            .eq('type', scanType)
            .gte('timestamp', startOfDay)
            .lte('timestamp', endOfDay);

          if (existingStudentRecords && existingStudentRecords.length > 0) {
            return NextResponse.json({ 
              error: 'DOUBLE_SCAN', 
              message: `Double verification block: Scholar ${student.first_name} has already logged a standard ${scanType === 'arrival' ? 'check-in' : 'check-out'} gate scan today.` 
            }, { status: 400 });
          }

          // 3. Insert attendance record
          const { data: insertedRecord, error: insertErr } = await supabase
            .from('attendance_records')
            .insert({
              student_id,
              school_id: schoolId,
              type: scanType,
              status: scanStatus,
              timestamp: scanTime
            })
            .select()
            .maybeSingle();

          if (insertErr) {
            console.error('[record_attendance_scan] Database insertion error:', insertErr);
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
          }

          // 3. Trigger email & push alerts through Parent Notify
          let parentNotifiedCount = 0;
          try {
            const { notifyParentsOfAttendance } = await import('@/lib/notifications/parent-notify');
            const notifyRes = await notifyParentsOfAttendance({
              student_id,
              attendance_record_id: insertedRecord.id,
              type: scanType as 'arrival' | 'departure'
            });
            parentNotifiedCount = notifyRes.notified;
          } catch (notifErr) {
            console.error('[record_attendance_scan] Parent notify trigger exception:', notifErr);
          }

          return NextResponse.json({ 
            success: true, 
            record: insertedRecord, 
            notified_parents_count: parentNotifiedCount 
          });

        } else {
          // Staff Check-in or Check-out
          // 1. Find staff name or details
          const { data: staffProfile, error: profileErr } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', staff_id)
            .maybeSingle();

          const { data: staffRole } = await supabase
            .from('user_school_roles')
            .select('school_id, role')
            .eq('user_id', staff_id)
            .maybeSingle();

          const schoolId = staffRole?.school_id || 'demo-school-id';
          const staffName = staffProfile?.full_name || 'Staff User';
          const staffEmail = staffProfile?.email;

          // 1.5. Double Scan Check (Single sign-in and sign-out per school day)
          const dateStr = scanTime.substring(0, 10);
          const startOfDay = `${dateStr}T00:00:00.000Z`;
          const endOfDay = `${dateStr}T23:59:59.999Z`;

          const { data: existingStaffRecords } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('source', `staff_id:${staff_id}`)
            .eq('type', scanType)
            .gte('timestamp', startOfDay)
            .lte('timestamp', endOfDay);

          if (existingStaffRecords && existingStaffRecords.length > 0) {
            return NextResponse.json({ 
              error: 'DOUBLE_SCAN', 
              message: `Double verification block: Staff member ${staffName} has already logged a standard ${scanType === 'arrival' ? 'sign-in' : 'sign-out'} gate scan today.` 
            }, { status: 400 });
          }

          // 2. Create attendance entry
          const { data: insertedRecord, error: insertErr } = await supabase
            .from('attendance_records')
            .insert({
              school_id: schoolId,
              type: scanType,
              status: scanStatus,
              timestamp: scanTime,
              source: `staff_id:${staff_id}`
            })
            .select()
            .maybeSingle();

          if (insertErr) {
            console.error('[record_attendance_scan] Staff insert error:', insertErr);
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
          }

          // 3. Trigger email to staff person confirming their entry / exit!
          let staffEmailSent = false;
          if (staffEmail && process.env.RESEND_API_KEY) {
            try {
              const { Resend } = await import('resend');
              const resend = new Resend(process.env.RESEND_API_KEY);
              const dateStr = new Date(scanTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
              const timeStr = new Date(scanTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

              const emailHtml = `
                <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                  <div style="background: #1e3a8a; padding: 24px; text-align: center; color: white;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: 800; text-transform: uppercase;">MyEduRide Staff Portal</h2>
                    <p style="margin: 4px 0 0; font-size: 11px; opacity: 0.9; text-transform: uppercase; tracking: 0.05em; color: #fbbf24;">Terminal Scan Verified</p>
                  </div>
                  <div style="padding: 24px; background: white;">
                    <h3 style="color: #111827; margin-top: 0; font-size: 15px; font-weight: 700;">Hello ${staffName},</h3>
                    <p style="color: #4b5563; font-size: 13.5px; line-height: 1.5;">Your terminal gateway boarding event has been successfully processed by the school node.</p>
                    
                    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #f3f4f6;">
                      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">STAFF MEMBER</td>
                          <td style="color: #111827; padding: 4px 0; text-align: right; font-weight: 700;">${staffName}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">PASSAGE DIRECTION</td>
                          <td style="color: #111827; padding: 4px 0; text-align: right; font-weight: 700; text-transform: uppercase;">${scanType === 'arrival' ? 'CHECK-IN (ENTRY)' : 'CHECK-OUT (EXIT)'}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">RECORDED TIME</td>
                          <td style="color: #111827; padding: 4px 0; text-align: right; font-weight: 700;">${timeStr} on ${dateStr}</td>
                        </tr>
                        <tr>
                          <td style="color: #6b7280; padding: 4px 0; font-weight: 600;">GATE NODE</td>
                          <td style="color: #059669; padding: 4px 0; text-align: right; font-weight: 750; text-transform: uppercase;">STATION ALPHA LIVE</td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
                      This email is an automated gate security receipt powered by MyEduRide Safety Network.
                    </p>
                  </div>
                </div>
              `;

              try {
                await resend.emails.send({
                  from: 'MyEduRide Gateways <noreply@assetid.site>',
                  to: staffEmail,
                  subject: `Gateway Transit Receipt: [${scanType.toUpperCase()}] ${staffName}`,
                  html: emailHtml,
                });
                staffEmailSent = true;
              } catch (domainErr: any) {
                console.warn('[record_attendance_scan] Staff receipt email failed via domain, retrying via onboarding@resend.dev:', domainErr?.message || domainErr);
                await resend.emails.send({
                  from: 'MyEduRide Gate <onboarding@resend.dev>',
                  to: staffEmail,
                  subject: `Gateway Transit Receipt: [${scanType.toUpperCase()}] ${staffName}`,
                  html: emailHtml,
                });
                staffEmailSent = true;
              }
            } catch (err) {
              console.error('[record_attendance_scan] Failed to send staff email alert:', err);
            }
          }

          return NextResponse.json({ 
            success: true, 
            record: insertedRecord, 
            staff_email_sent: staffEmailSent 
          });
        }
      }

      case 'get_current_profile': {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user_id)
          .maybeSingle();

        if (error) {
          console.error('[DATA API] Error fetching current user profile:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ profile });
      }

      case 'save_school_template': {
        const schoolId = params?.school_id;
        const template = params?.template;
        if (!schoolId) {
          return NextResponse.json({ error: 'school_id required' }, { status: 400 });
        }
        const { data: currentSchool } = await supabase
          .from('schools')
          .select('welcome_message')
          .eq('id', schoolId)
          .maybeSingle();

        let welcomeText = 'Welcome to our school';
        if (currentSchool?.welcome_message) {
          if (currentSchool.welcome_message.startsWith('{')) {
            try {
              const parsed = JSON.parse(currentSchool.welcome_message);
              welcomeText = parsed.welcomeText || parsed.welcome_message || 'Welcome to our school';
            } catch (e) {}
          } else {
            welcomeText = currentSchool.welcome_message;
          }
        }

        const newWelcomeMessage = JSON.stringify({
          is_config: true,
          welcomeText: welcomeText,
          template: template
        });

        const { error: updateErr } = await supabase
          .from('schools')
          .update({ welcome_message: newWelcomeMessage })
          .eq('id', schoolId);

        if (updateErr) {
          console.error('[DATA API] Error saving template:', updateErr.message);
          return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'get_school_template': {
        const schoolId = params?.school_id;
        if (!schoolId) {
          return NextResponse.json({ error: 'school_id required' }, { status: 400 });
        }
        const { data: school, error } = await supabase
          .from('schools')
          .select('welcome_message')
          .eq('id', schoolId)
          .maybeSingle();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        let template = null;
        if (school?.welcome_message && school.welcome_message.startsWith('{')) {
          try {
            const parsed = JSON.parse(school.welcome_message);
            template = parsed.template;
          } catch (e) {}
        }

        return NextResponse.json({ template });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Data API error:', err?.message || err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
