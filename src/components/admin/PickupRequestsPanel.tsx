'use client';

import { useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { todayInLagos } from '@/lib/timezone';
import { StudentAvatar } from '@/components/shared/StudentAvatar';
import { AlertCircle, Check, X, Clock, RefreshCw } from 'lucide-react';

interface PickupRequest {
  id: string;
  student_id: string;
  student?: {
    first_name: string;
    last_name: string;
    photo_url?: string | null;
  } | null;
  pickup_person_name: string;
  relationship: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
}

export default function PickupRequestsPanel({ schoolId }: { schoolId: string }) {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);

  useEffect(() => {
    setSupabaseConfigured(isSupabaseConfigured());
    loadRequests();

    // 5-second poll fallback
    const interval = setInterval(() => {
      loadRequests();
    }, 5000);

    // Supabase Realtime subscription
    let subscription: any = null;
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      subscription = supabase
        .channel('dismissal_requests_panel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'dismissal_requests',
            filter: `school_id=eq.${schoolId}`
          },
          () => {
            loadRequests();
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(interval);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [schoolId]);

  const loadRequests = async () => {
    setRefreshing(true);
    if (!isSupabaseConfigured()) {
      // Load premium interactive demo mock data in Sandbox mode
      setTimeout(() => {
        setRequests([
          {
            id: 'req-1',
            student_id: 'demo-student-1',
            student: { first_name: 'Zainab', last_name: 'Balogun', photo_url: null },
            pickup_person_name: 'Abisoye Balogun',
            relationship: 'Mother',
            status: 'pending',
            created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
          },
          {
            id: 'req-2',
            student_id: 'demo-student-2',
            student: { first_name: 'Chinedu', last_name: 'Eze', photo_url: null },
            pickup_person_name: 'Kene Eze',
            relationship: 'Uncle',
            status: 'pending',
            created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
          },
          {
            id: 'req-3',
            student_id: 'demo-student-3',
            student: { first_name: 'Tobi', last_name: 'Adeleke', photo_url: null },
            pickup_person_name: 'Segun Adeleke',
            relationship: 'Father',
            status: 'approved',
            created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25 mins ago
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

      setRequests(processed);
    } catch (err) {
      console.error('[PickupRequests] Error loading:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleAction = async (id: string, newStatus: 'approved' | 'rejected') => {
    // Optimistic UI state update
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
    );

    if (!isSupabaseConfigured()) {
      return; // Handled locally in Sandbox mode
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('dismissal_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('[PickupRequests] Action failed:', err);
      // Revert on error
      loadRequests();
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 font-sans h-full flex flex-col min-h-[380px]">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm md:text-base">Parent Pickup Requests</h3>
            {pendingRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingRequests.length} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Authorizations submitted by parents today.</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          disabled={refreshing}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition"
          title="Refresh active requests"
          aria-label="Refresh active requests"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col gap-3 justify-center items-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="text-xs text-gray-400">Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-100">
          <AlertCircle size={24} className="text-gray-300 mb-2" />
          <p className="text-xs font-medium text-gray-700">No pickup requests yet</p>
          <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Parents can request student pickups through their mobile portal.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 max-h-[340px] pr-1">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-3 bg-gray-55 border border-gray-100 rounded-xl flex items-center justify-between gap-3 hover:bg-gray-50/80 transition shadow-2xs"
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
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pickup: <span className="font-semibold text-gray-800">{req.pickup_person_name}</span> ({req.relationship})
                  </p>
                  <p className="text-[9px] text-gray-400 flex items-center gap-1 mt-1 font-medium font-mono">
                    <Clock size={10} />
                    {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div>
                {req.status === 'pending' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAction(req.id, 'approved')}
                      className="p-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <Check size={10} />
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="p-1 px-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                      title="Decline Request"
                      aria-label="Decline Request"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      req.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : req.status === 'rejected'
                        ? 'bg-red-50 text-red-700 border border-red-100'
                        : 'bg-gray-150 text-gray-700'
                    }`}
                  >
                    {req.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
