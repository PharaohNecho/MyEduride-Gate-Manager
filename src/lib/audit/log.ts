import { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogParams {
  school_id?: string | null;
  actor_user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  details?: Record<string, any> | null;
}

export async function writeAuditLog(supabase: SupabaseClient, log: AuditLogParams) {
  try {
    if (!supabase) {
      console.log('[writeAuditLog] Demo mode / Supabase not available. Log:', log);
      return { ok: true };
    }
    const { error } = await supabase.from('audit_logs').insert([log]);
    if (error) {
      console.error('[writeAuditLog] Error inserting into audit_logs:', error);
      return { error };
    }
    return { ok: true };
  } catch (e) {
    console.error('[writeAuditLog] Exception writing audit log:', e);
    return { error: e };
  }
}
