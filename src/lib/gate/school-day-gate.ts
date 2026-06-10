import { SupabaseClient } from '@supabase/supabase-js';

export interface GateDayStatus {
  date: string;
  is_school_day: boolean;
  gate_status: 'open' | 'closed';
  morning_window_open: boolean;
  afternoon_window_open: boolean;
}

export async function getGateDayStatus(
  supabase: SupabaseClient,
  schoolId: string,
  todayStr: string
): Promise<GateDayStatus> {
  const now = new Date();
  const lagosTime = new Date(now.getTime() + 1 * 60 * 60 * 1000);
  const hour = lagosTime.getUTCHours();
  
  const isMorning = hour >= 7 && hour < 10;
  const isAfternoon = hour >= 13 && hour < 17;

  return {
    date: todayStr,
    is_school_day: true,
    gate_status: (isMorning || isAfternoon) ? 'open' : 'closed',
    morning_window_open: isMorning,
    afternoon_window_open: isAfternoon,
  };
}
