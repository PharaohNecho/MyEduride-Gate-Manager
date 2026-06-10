import { SupabaseClient } from '@supabase/supabase-js';

export async function fetchSchoolLateThreshold(supabase: SupabaseClient, schoolId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('schools')
      .select('late_threshold_minutes')
      .eq('id', schoolId)
      .maybeSingle();
    return data?.late_threshold_minutes ?? 480; // Default: 8:00 AM (480 minutes past midnight)
  } catch (err) {
    console.warn('[staff-report] Fallback using default threshold:', err);
    return 480;
  }
}

export async function buildStaffDailyReport(
  supabase: SupabaseClient,
  schoolId: string,
  dateStr: string,
  dayStartIso: string,
  dayEndIso: string,
  options: { staffUserIds?: string[] | null; excluded?: boolean; lateThreshold?: number } = {}
) {
  try {
    const threshold = options.lateThreshold ?? 480;

    // 1. Get staff users
    let rolesQuery = supabase
      .from('user_school_roles')
      .select('user_id, role')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .in('role', ['school_admin', 'teacher', 'gate_officer', 'staff']);

    if (options.staffUserIds) {
      rolesQuery = rolesQuery.in('user_id', options.staffUserIds);
    }

    const { data: roles, error: rolesErr } = await rolesQuery;
    if (rolesErr || !roles || roles.length === 0) return [];

    const userIds = roles.map((r: any) => r.user_id);
    const roleByUserId = new Map<string, string>();
    for (const r of roles) {
      roleByUserId.set(r.user_id, r.role);
    }

    const { data: profiles, error: profilesErr } = await supabase
      .from('user_profiles')
      .select('id, full_name, username')
      .in('id', userIds);

    if (profilesErr || !profiles || profiles.length === 0) return [];

    // 2. Fetch clock-in logs
    const { data: logs, error: logsErr } = await supabase
      .from('gate_activity_logs')
      .select('action_type, gate_officer_user_id, created_at, details')
      .eq('school_id', schoolId)
      .in('action_type', ['clock_in', 'clock_out'])
      .gte('created_at', dayStartIso)
      .lte('created_at', dayEndIso);

    const clockInByUser = new Map<string, string>();
    const clockOutByUser = new Map<string, string>();

    for (const log of logs || []) {
      const staffId = log.details?.staff_user_id || log.gate_officer_user_id;
      if (!staffId) continue;

      if (log.action_type === 'clock_in') {
        const existing = clockInByUser.get(staffId);
        if (!existing || new Date(log.created_at) < new Date(existing)) {
          clockInByUser.set(staffId, log.created_at);
        }
      } else if (log.action_type === 'clock_out') {
        const existing = clockOutByUser.get(staffId);
        if (!existing || new Date(log.created_at) > new Date(existing)) {
          clockOutByUser.set(staffId, log.created_at);
        }
      }
    }

    // 3. Build report
    return profiles.map((p: any) => {
      const userRole = roleByUserId.get(p.id) || 'staff';
      const clockInStr = clockInByUser.get(p.id) || null;
      const clockOutStr = clockOutByUser.get(p.id) || null;

      let status: 'present' | 'late' | 'absent' = 'absent';
      let minutes_late: number | null = null;

      if (options.excluded) {
        status = 'absent';
      } else if (clockInStr) {
        status = 'present';
        const clockInTime = new Date(clockInStr);
        const lagosTime = new Date(clockInTime.getTime() + 1 * 60 * 60 * 1000);
        const hrs = lagosTime.getUTCHours();
        const mins = lagosTime.getUTCMinutes();
        const minutesPastMidnight = hrs * 60 + mins;

        if (minutesPastMidnight > threshold) {
          status = 'late';
          minutes_late = minutesPastMidnight - threshold;
        }
      }

      return {
        user_id: p.id,
        full_name: p.full_name || p.username || 'Staff User',
        role: userRole,
        status,
        clock_in_time: clockInStr,
        clock_out_time: clockOutStr,
        minutes_late,
      };
    });
  } catch (err) {
    console.error('[staff-report] Exception in daily report:', err);
    return [];
  }
}

export async function buildStaffMonthlyReport(
  supabase: SupabaseClient,
  schoolId: string,
  rangeStartIso: string,
  rangeEndIso: string,
  monthCalendarDays: string[],
  options: { staffUserIds?: string[] | null; nonSchoolDays?: Map<string, any>; lateThreshold?: number } = {}
) {
  try {
    const threshold = options.lateThreshold ?? 480;

    let rolesQuery = supabase
      .from('user_school_roles')
      .select('user_id, role')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .in('role', ['school_admin', 'teacher', 'gate_officer', 'staff']);

    if (options.staffUserIds) {
      rolesQuery = rolesQuery.in('user_id', options.staffUserIds);
    }

    const { data: roles, error: rolesErr } = await rolesQuery;
    if (rolesErr || !roles || roles.length === 0) return [];

    const userIds = roles.map((r: any) => r.user_id);
    const roleByUserId = new Map<string, string>();
    for (const r of roles) {
      roleByUserId.set(r.user_id, r.role);
    }

    const { data: profiles, error: profilesErr } = await supabase
      .from('user_profiles')
      .select('id, full_name, username')
      .in('id', userIds);

    if (profilesErr || !profiles || profiles.length === 0) return [];

    const { data: logs, error: logsErr } = await supabase
      .from('gate_activity_logs')
      .select('action_type, gate_officer_user_id, created_at, details')
      .eq('school_id', schoolId)
      .in('action_type', ['clock_in', 'clock_out'])
      .gte('created_at', rangeStartIso)
      .lte('created_at', rangeEndIso);

    const presenceByUserAndDate = new Map<string, Set<string>>();
    for (const log of logs || []) {
      const staffId = log.details?.staff_user_id || log.gate_officer_user_id;
      if (!staffId) continue;

      const logDate = new Date(log.created_at);
      const lagos = new Date(logDate.getTime() + 1 * 60 * 60 * 1000);
      const dateStr = lagos.toISOString().split('T')[0];

      if (!presenceByUserAndDate.has(staffId)) {
        presenceByUserAndDate.set(staffId, new Set<string>());
      }
      presenceByUserAndDate.get(staffId)!.add(dateStr);
    }

    return profiles.map((p: any) => {
      const userRole = roleByUserId.get(p.id) || 'staff';
      const userPresence = presenceByUserAndDate.get(p.id);

      const days = monthCalendarDays.map((dateStr) => {
        const hasClockIn = userPresence?.has(dateStr) ?? false;
        const isExcluded = options.nonSchoolDays?.has(dateStr) ?? false;

        let status = 'absent';
        let present = false;

        if (hasClockIn && !isExcluded) {
          status = 'present';
          present = true;
        } else if (isExcluded) {
          status = 'excluded';
        }

        return {
          date: dateStr,
          present,
          status,
        };
      });

      return {
        user_id: p.id,
        full_name: p.full_name || p.username || 'Staff User',
        role: userRole,
        days,
      };
    });
  } catch (err) {
    console.error('[staff-report] Exception in monthly report:', err);
    return [];
  }
}
