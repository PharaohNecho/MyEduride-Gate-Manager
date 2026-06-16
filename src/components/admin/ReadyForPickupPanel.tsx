'use client';

import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { todayInLagos } from '@/lib/timezone';
import { StudentAvatar } from '@/components/shared/StudentAvatar';
import { AlertCircle, CheckSquare, Clock, RefreshCw, Sparkles } from 'lucide-react';

interface ReadyStudent {
  id: string; // dismissal request id
  student_id: string;
  student?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  pickup_person_name: string;
  relationship: string;
  status: string;
  created_at: string;
}

export default function ReadyForPickupPanel({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<ReadyStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReadyStudents();
  }, [schoolId]);

  const loadReadyStudents = async () => {
    setRefreshing(true);
    if (!isSupabaseConfigured()) {
      // Mock data for Sandbox demo
      setTimeout(() => {
        setStudents([
          {
            id: 'req-3',
            student_id: 'demo-student-3',
            student: { first_name: 'Tobi', last_name: 'Adeleke', photo_url: null },
            pickup_person_name: 'Segun Adeleke',
            relationship: 'Father',
            status: 'approved',
            created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          },
          {
            id: 'req-4',
            student_id: 'demo-student-4',
            student: { first_name: 'Amara', last_name: 'Okonkwo', photo_url: null },
            pickup_person_name: 'Chioma Okonkwo',
            relationship: 'Mother',
            status: 'approved',
            created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
          }
        ]);
        setLoading(false);
        setRefreshing(false);
      }, 500);
      return;
    }

    try {
      const supabase = createClient();
      const today = todayInLagos();

      const { data, error } = await supabase
        .from('dismissal_requests')
        .select(`
          id,
          student_id,
          notes,
          status,
          created_at,
          student:students(first_name, last_name, photo_url)
        `)
        .eq('school_id', schoolId)
        .eq('dismissal_date', today)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = (data as any[] || []).map((item) => {
        let req = { ...item, pickup_person_name: '', relationship: '' };
        if (item.notes) {
          try {
            const parsed = JSON.parse(item.notes);
            req.pickup_person_name = parsed.pickup_person_name || '';
            req.relationship = parsed.relationship || '';
          } catch (e) {
            // ignore
          }
        }
        return req;
      });

      setStudents(processed);
    } catch (err) {
      console.error('[ReadyForPickupPanel] Error loading:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    // Optimistic UI state update (remove from view or mark as completed)
    setStudents((prev) => prev.filter((s) => s.id !== id));

    if (!isSupabaseConfigured()) {
      return; // Handled locally in Sandbox mode
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('dismissal_requests')
        .update({ status: 'completed' })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[ReadyForPickupPanel] Mark completed failed:', err);
      loadReadyStudents();
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 font-sans h-full flex flex-col min-h-[380px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm md:text-base">Ready for Gate Pickup</h3>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles size={8} />
              Holding Zone
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Approved students waiting in the assembly room for their parent.</p>
        </div>
        <button
          type="button"
          onClick={loadReadyStudents}
          disabled={refreshing}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
          title="Refresh holding zone list"
          aria-label="Refresh holding zone list"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col gap-3 justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-xs text-gray-400">Loading assembly zone...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
          <AlertCircle size={24} className="text-gray-300 mb-2" />
          <p className="text-xs font-medium text-gray-700">No students in assembly zone</p>
          <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Once parent requests are approved, students appear here awaiting actual hand-off.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
          {students.map((req) => (
            <div
              key={req.id}
              className="p-3 bg-emerald-50/30 border border-emerald-100/50 rounded-xl flex items-center justify-between gap-3 hover:bg-emerald-50/50 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <StudentAvatar
                  photoUrl={req.student?.photo_url}
                  firstName={req.student?.first_name || ''}
                  lastName={req.student?.last_name || ''}
                  size={38}
                />
                <div>
                  <p className="text-xs font-semibold text-gray-900">
                    {req.student?.first_name} {req.student?.last_name}
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Parent: <span className="font-semibold">{req.pickup_person_name}</span> ({req.relationship})
                  </p>
                  <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-1 font-medium font-mono">
                    <Clock size={10} />
                    Approved at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleMarkCompleted(req.id)}
                  className="p-1.5 px-3 bg-gray-900 text-white hover:bg-gray-850 rounded-xl text-[10px] font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <CheckSquare size={12} />
                  Departed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
