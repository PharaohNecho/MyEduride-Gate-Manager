import { SupabaseClient } from '@supabase/supabase-js';

export interface SchoolCalendarContext {
  weekendDays: number[]; // [0, 6] for Sunday, Saturday
  nonSchoolDays: Map<string, { title: string }>;
}

export async function fetchSchoolCalendarContext(
  supabase: SupabaseClient,
  schoolId: string,
  startDateStr: string,
  endDateStr: string
): Promise<SchoolCalendarContext> {
  const nonSchoolDays = new Map<string, { title: string }>();
  
  try {
    const { data: exceptions, error } = await supabase
      .from('school_calendar_exceptions')
      .select('date, title')
      .eq('school_id', schoolId)
      .gte('date', startDateStr)
      .lte('date', endDateStr);

    if (!error && exceptions) {
      for (const exc of exceptions) {
        nonSchoolDays.set(exc.date, { title: exc.title });
      }
    }
  } catch (e) {
    console.log('[school-calendar] exception query fallback:', e);
  }

  return {
    weekendDays: [0, 6],
    nonSchoolDays,
  };
}

export function isWeekendDay(dayKey: string, weekendDays: number[] = [0, 6]): boolean {
  const parts = dayKey.split('-').map(Number);
  if (parts.length !== 3) return false;
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const day = date.getDay();
  return weekendDays.includes(day);
}

export function isCountableSchoolDayWithContext(dayKey: string, ctx: SchoolCalendarContext): boolean {
  if (isWeekendDay(dayKey, ctx.weekendDays)) return false;
  if (ctx.nonSchoolDays.has(dayKey)) return false;
  return true;
}
