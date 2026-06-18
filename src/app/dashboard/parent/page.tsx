// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, fetchData, logout } from '@/lib/api';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { StudentAvatar } from '@/components/shared/StudentAvatar';
import { todayInLagos, formatTimeLagos } from '@/lib/timezone';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User,
  Users, 
  Calendar, 
  Car, 
  Bell, 
  LogOut, 
  Send, 
  ChevronDown, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  UserCheck,
  Check,
  Sliders,
  Database,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Inbox
} from 'lucide-react';

const TABS = [
  { id: 'kids', label: 'My Kids', icon: Users, description: 'Manage children rosters and basic profiles' },
  { id: 'history', label: 'History', icon: Calendar, description: 'Track check-in and check-out logs' },
  { id: 'pickup', label: 'Pickup', icon: Car, description: 'Authorize pickup guardians on-the-fly' },
  { id: 'alerts', label: 'Alerts', icon: Bell, description: 'Live notifications and gate dispatch alerts' },
  { id: 'profile', label: 'Profile Settings', icon: User, description: 'Manage security credentials and lock passcodes' },
];

const DEFAULT_SANDBOX_KIDS = [
  {
    id: 'stu-demo-john',
    first_name: 'john',
    last_name: 'doe',
    student_id_number: 'STU-F950-MQBSEC90',
    class_name: 'General',
    relationship: 'Parent',
    school_id: 'sch-2',
    school: {
      name: 'Metagen Academy',
      primary_color: '#10b981'
    }
  },
  {
    id: 'stu-demo-samuel',
    first_name: 'Samuel',
    last_name: 'Okon',
    student_id_number: 'MER-1049',
    class_name: 'Grade 5 Gold',
    relationship: 'Father',
    school_id: 'demo-school-id',
    school: {
      name: 'MyEduRide Prototype Academy',
      primary_color: '#0284c7'
    }
  }
];

export default function ParentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('kids');
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [parentName, setParentName] = useState('doe');
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Profile management states
  const [session, setSession] = useState<any>(null);
  const [parentTitle, setParentTitle] = useState('Guardian');
  const [parentPhotoUrl, setParentPhotoUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) {
        headers['x-myeduride-session'] = encodeURIComponent(JSON.stringify(session));
      }
      const response = await fetch('/api/school-admin/users/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: session?.user_id,
          full_name: parentName,
          title: parentTitle,
          photo_base64: photoBase64,
          email: session?.email,
          username: session?.username
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to update identity parameters.');
      setProfileSuccess('Profile parameters synced successfully.');
      const updated = { 
        ...session, 
        full_name: parentName, 
        title: parentTitle, 
        photo_url: data.profile?.photo_url || session.photoUrl || session.photo_url 
      };
      localStorage.setItem('myeduride_session', JSON.stringify(updated));
      setSession(updated);
      setParentPhotoUrl(updated.photo_url);
      setPhotoBase64(null); // Clear after successfully uploaded
    } catch (err: any) {
      setProfileError(err.message || 'Error occurred.');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdNew.trim()) {
      setPwdError('New password is required');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError('Passwords do not match');
      return;
    }
    setPwdLoading(true);
    setPwdError('');
    setPwdSuccess('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) {
        headers['x-myeduride-session'] = encodeURIComponent(JSON.stringify(session));
      }
      const response = await fetch('/api/school-admin/users/set-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: session?.user_id,
          password: pwdNew,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      setPwdSuccess('Password security lock updated successfully!');
      setPwdNew('');
      setPwdConfirm('');
    } catch (err: any) {
      setPwdError(err.message || 'Error occurred updating password');
    } finally {
      setPwdLoading(false);
    }
  };

  // History Tab States
  const [historyFilter, setHistoryFilter] = useState('Daily');
  const [selectedDate, setSelectedDate] = useState(() => todayInLagos());
  const [attendanceRecord, setAttendanceRecord] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Weekly/Monthly Mock Visual States for High-Fidelity UX
  const [weeklyRecords, setWeeklyRecords] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [yearlyStats, setYearlyStats] = useState<any[]>([]);

  // Pickup Tab States
  const [pickingUpMyself, setPickingUpMyself] = useState(true);
  const [pickupPersonName, setPickupPersonName] = useState('doe jane');
  const [relationship, setRelationship] = useState('Mother');
  const [noteToSchool, setNoteToSchool] = useState('');
  const [submittingPickup, setSubmittingPickup] = useState(false);
  const [recentPickups, setRecentPickups] = useState<any[]>([]);
  const [authorizedPersons, setAuthorizedPersons] = useState<any[]>([]);
  const [authPersonsLoading, setAuthPersonsLoading] = useState(false);

  // Alerts Tab States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const loadRecentPickups = async (dbConnected: boolean, childId: string) => {
    if (!dbConnected) {
      const savedLocalPickups = localStorage.getItem('myeduride_local_dismissals');
      if (savedLocalPickups) {
        try {
          setRecentPickups(JSON.parse(savedLocalPickups));
        } catch (e) {
          console.error(e);
        }
      }
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('dismissal_requests')
        .select('*')
        .eq('student_id', childId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        const processed = data.map((item: any) => {
          if (item.notes) {
            try {
              const parsed = JSON.parse(item.notes);
              return {
                ...item,
                pickup_person_name: parsed.pickup_person_name || item.pickup_person_name,
                relationship: parsed.relationship || item.relationship,
                pickup_person_phone: parsed.pickup_person_phone || item.pickup_person_phone
              };
            } catch (e) {
              // ignore
            }
          }
          return item;
        });
        setRecentPickups(processed);
      }
    } catch (e) {
      console.error('Failed to load real dismissal status:', e);
    }
  };

  const loadAuthorizedPersons = async (childId: string) => {
    setAuthPersonsLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setAuthorizedPersons([
          { id: '1', name: 'doe jane', relationship: 'Mother', phone: '+2348011111111' },
          { id: '2', name: 'Uncle Segun', relationship: 'Uncle', phone: '+2348022222222' }
        ]);
        return;
      }
      const session = getSession();
      if (!session) return;
      const res = await fetch(`/api/pickup-persons?student_id=${childId}`, {
        headers: {
          'x-myeduride-session': encodeURIComponent(JSON.stringify(session))
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAuthorizedPersons(data.pickup_persons || []);
      } else {
        setAuthorizedPersons([]);
      }
    } catch (e) {
      console.error('Failed to load authorized persons:', e);
      setAuthorizedPersons([]);
    } finally {
      setAuthPersonsLoading(false);
    }
  };

  // Load Session, Kids and database configuration sync
  useEffect(() => {
    const session = getSession();
    if (!session?.user_id) {
      router.push('/auth/login');
      return;
    }
    setSession(session);
    setParentName(session.full_name || 'doe');
    setParentTitle(session.title || 'Guardian');
    setParentPhotoUrl(session.photo_url || null);

    const connected = isSupabaseConfigured();
    setIsDbConnected(connected);

    // Initial default pickup persons list
    const savedLocalPickups = localStorage.getItem('myeduride_local_dismissals');
    if (savedLocalPickups) {
      try {
        setRecentPickups(JSON.parse(savedLocalPickups));
      } catch (e) {
        console.error('Failed to parse active local pickups:', e);
      }
    } else {
      // High fidelity default mock record exactly matching Screenshot 4!
      const initialLogs = [
        {
          id: 'log-default-1',
          pickup_person_name: 'doe jane',
          relationship: 'Mother',
          created_at: new Date('2026-06-15T13:19:00Z').toISOString(), // 15 Jun 2026, 13:19
          student_id: 'stu-demo-john',
          status: 'approved'
        }
      ];
      setRecentPickups(initialLogs);
      localStorage.setItem('myeduride_local_dismissals', JSON.stringify(initialLogs));
    }

    loadChildren(connected);
    loadNotifications(connected);
  }, []);

  // Sync pickup person name default based on profile
  useEffect(() => {
    if (pickingUpMyself) {
      setPickupPersonName(parentName || 'doe jane');
    } else {
      setPickupPersonName('');
    }
  }, [pickingUpMyself, parentName]);

  // Load Children and sync
  const loadChildren = async (dbConnected: boolean) => {
    setLoading(true);
    try {
      if (dbConnected) {
        const data = await fetchData('get_parent_children');
        if (data?.children && data.children.length > 0) {
          setChildren(data.children);
          setSelectedChild(data.children[0]);
        } else {
          // If Connected DB exists but contains no parent relations, provide high fidelity sandbox fallback combined
          setChildren(DEFAULT_SANDBOX_KIDS);
          setSelectedChild(DEFAULT_SANDBOX_KIDS[0]);
        }
      } else {
        // Fallback for Sandbox Mode
        setChildren(DEFAULT_SANDBOX_KIDS);
        setSelectedChild(DEFAULT_SANDBOX_KIDS[0]);
      }
    } catch (e) {
      console.error('Failed to load children:', e);
      setChildren(DEFAULT_SANDBOX_KIDS);
      setSelectedChild(DEFAULT_SANDBOX_KIDS[0]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch / Calculate Attendance when date, active child, or tab shifts
  useEffect(() => {
    if (selectedChild) {
      loadAttendance(selectedChild.id, selectedDate);
      generateAdvancedAttendanceStats(selectedChild.id);
      loadRecentPickups(isDbConnected, selectedChild.id);
      loadAuthorizedPersons(selectedChild.id);
    }
  }, [selectedChild, selectedDate, activeTab]);

  const loadAttendance = async (childId: string, dateStr: string) => {
    setHistoryLoading(true);
    if (!isDbConnected) {
      // Simulate Sandbox attendance
      setTimeout(() => {
        // High fidelity check: matches Screenshot 3: 06/16/2026 is Absent!
        if (dateStr === '2026-06-16') {
          setAttendanceRecord({
            status: 'Absent',
            check_in: null,
            check_out: null,
          });
        } else {
          // Present for other past weekdays, absent on weekends
          const d = new Date(dateStr);
          const day = d.getDay();
          if (day === 0 || day === 6) {
            setAttendanceRecord({
              status: 'Absent',
              check_in: null,
              check_out: null,
            });
          } else {
            setAttendanceRecord({
              status: 'Present',
              check_in: '07:44 WAT',
              check_out: '14:12 WAT',
            });
          }
        }
        setHistoryLoading(false);
      }, 300);
      return;
    }

    try {
      const supabase = createClient();
      
      // Calculate start and end ISO for selectedDate
      const startLocal = new Date(`${dateStr}T00:00:00.000Z`);
      const startUtc = new Date(startLocal.getTime() - 1 * 60 * 60 * 1000); // lagos timezone shift
      const endLocal = new Date(`${dateStr}T23:59:59.999Z`);
      const endUtc = new Date(endLocal.getTime() - 1 * 60 * 60 * 1000);

      const { data: records, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', childId)
        .gte('timestamp', startUtc.toISOString())
        .lte('timestamp', endUtc.toISOString());

      if (error) throw error;

      if (!records || records.length === 0) {
        setAttendanceRecord({
          status: 'Absent',
          check_in: null,
          check_out: null,
        });
      } else {
        const arrival = records.find(r => r.type === 'arrival');
        const departure = records.find(r => r.type === 'departure');

        setAttendanceRecord({
          status: arrival ? (arrival.status === 'late' ? 'Late' : 'Present') : 'Absent',
          check_in: arrival ? `${formatTimeLagos(arrival.timestamp)} WAT` : '—',
          check_out: departure ? `${formatTimeLagos(departure.timestamp)} WAT` : '—',
        });
      }
    } catch (e) {
      console.error('Error loading real attendance:', e);
      setAttendanceRecord({
        status: 'Absent',
        check_in: '—',
        check_out: '—',
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Generate Real Analytics Stats for Analytics Overview from Live server, fallback to Sandbox
  const generateAdvancedAttendanceStats = async (childId: string) => {
    if (!isDbConnected) {
      // Return beautiful fallback mock data so sandbox works perfect:
      setWeeklyRecords([
        { day: 'Mon', date: '15 Jun', status: 'Present', arrival: '07:42 WAT', departure: '14:10 WAT' },
        { day: 'Tue', date: '16 Jun', status: 'Absent', arrival: '—', departure: '—' },
        { day: 'Wed', date: '17 Jun', status: 'Present', arrival: '07:38 WAT', departure: '14:05 WAT' },
        { day: 'Thu', date: '18 Jun', status: 'Present', arrival: '07:51 WAT', departure: '14:15 WAT' },
        { day: 'Fri', date: '19 Jun', status: 'Late', arrival: '08:05 WAT', departure: '14:00 WAT' },
      ]);
      setMonthlyStats({
        presentCount: 17,
        lateCount: 2,
        absentCount: 1,
        totalDays: 20,
        percentage: '95%',
        avgCheckIn: '7:46 AM'
      });
      setYearlyStats([
        { term: 'Term 1 (Sept - Dec)', rate: 94, present: 54, total: 57 },
        { term: 'Term 2 (Jan - Apr)', rate: 97, present: 58, total: 60 },
        { term: 'Term 3 (May - Jul)', rate: 95, present: 19, total: 20 },
      ]);
      return;
    }

    try {
      const supabase = createClient();
      // Fetch all attendance records for this child
      const { data: allRecords, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', childId)
        .order('timestamp', { ascending: false });

      if (error || !allRecords) throw error || new Error('No records');

      // 1. Compute Weekly Records
      const date = new Date(selectedDate);
      const currentDay = date.getDay(); // 0 (Sun) to 6 (Sat)
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(date);
      monday.setDate(date.getDate() + mondayOffset);

      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
      const weekList: any[] = [];

      for (let i = 0; i < 5; i++) {
        const loopDate = new Date(monday);
        loopDate.setDate(monday.getDate() + i);
        const dateString = loopDate.toISOString().split('T')[0];
        
        const dayRecords = allRecords.filter(r => {
          const rDate = new Date(r.timestamp).toISOString().split('T')[0];
          return rDate === dateString;
        });

        const arrival = dayRecords.find(r => r.type === 'arrival');
        const departure = dayRecords.find(r => r.type === 'departure');

        const formattedDateLabel = loopDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

        if (dayRecords.length > 0) {
          const isLate = arrival?.status === 'late';
          weekList.push({
            day: daysOfWeek[i],
            date: formattedDateLabel,
            status: isLate ? 'Late' : 'Present',
            arrival: arrival ? `${formatTimeLagos(arrival.timestamp)} WAT` : '—',
            departure: departure ? `${formatTimeLagos(departure.timestamp)} WAT` : '—',
          });
        } else {
          const todayStr = todayInLagos();
          const isFuture = dateString > todayStr;
          weekList.push({
            day: daysOfWeek[i],
            date: formattedDateLabel,
            status: isFuture ? '—' : 'Absent',
            arrival: '—',
            departure: '—',
          });
        }
      }
      setWeeklyRecords(weekList);

      // 2. Compute Monthly Stats
      const activeMonth = date.getMonth(); // 0-11
      const activeYear = date.getFullYear();

      const monthRecords = allRecords.filter(r => {
        const rDate = new Date(r.timestamp);
        return rDate.getMonth() === activeMonth && rDate.getFullYear() === activeYear;
      });

      const recordsByDate: Record<string, any[]> = {};
      monthRecords.forEach(r => {
        const dStr = new Date(r.timestamp).toISOString().split('T')[0];
        if (!recordsByDate[dStr]) recordsByDate[dStr] = [];
        recordsByDate[dStr].push(r);
      });

      let presentCount = 0;
      let lateCount = 0;
      let checkInTimes: number[] = [];

      Object.keys(recordsByDate).forEach(dStr => {
        const dayRecs = recordsByDate[dStr];
        const arr = dayRecs.find(r => r.type === 'arrival');
        if (arr) {
          if (arr.status === 'late') {
            lateCount++;
          } else {
            presentCount++;
          }
          checkInTimes.push(new Date(arr.timestamp).getTime());
        } else if (dayRecs.some(r => r.type === 'departure')) {
          presentCount++;
        }
      });

      let totalSchoolDays = 0;
      const startOfActiveMonth = new Date(activeYear, activeMonth, 1);
      const endOfActiveMonth = new Date(activeYear, activeMonth + 1, 0);
      const lastDayToCount = new Date() < endOfActiveMonth ? new Date() : endOfActiveMonth;

      for (let d = new Date(startOfActiveMonth); d <= lastDayToCount; d.setDate(d.getDate() + 1)) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) {
          totalSchoolDays++;
        }
      }

      if (totalSchoolDays === 0) totalSchoolDays = 20;

      const absentCount = Math.max(0, totalSchoolDays - (presentCount + lateCount));
      const attendedCount = presentCount + lateCount;
      const percentageVal = totalSchoolDays > 0 ? Math.round((attendedCount / totalSchoolDays) * 100) : 100;

      let avgCheckIn = '07:44 AM';
      if (checkInTimes.length > 0) {
        const avgTimestamp = checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length;
        avgCheckIn = formatTimeLagos(new Date(avgTimestamp).toISOString());
      }

      setMonthlyStats({
        presentCount,
        lateCount,
        absentCount,
        totalDays: totalSchoolDays,
        percentage: `${percentageVal}%`,
        avgCheckIn
      });

      // 3. Compute Yearly Stats (Termly)
      const terms = [
        { name: 'Term 1 (Sept - Dec)', months: [8, 9, 10, 11] },
        { name: 'Term 2 (Jan - Apr)', months: [0, 1, 2, 3] },
        { name: 'Term 3 (May - Jul)', months: [4, 5, 6, 7] }
      ];

      const computedTerms = terms.map(term => {
        const termRecords = allRecords.filter(r => {
          const rMonth = new Date(r.timestamp).getMonth();
          return term.months.includes(rMonth);
        });

        const termDaysByDate: Record<string, any[]> = {};
        termRecords.forEach(r => {
          const dStr = new Date(r.timestamp).toISOString().split('T')[0];
          if (!termDaysByDate[dStr]) termDaysByDate[dStr] = [];
          termDaysByDate[dStr].push(r);
        });

        const attended = Object.keys(termDaysByDate).length;
        const totalTermDays = term.name.includes('Term 3') ? 22 : term.name.includes('Term 2') ? 60 : 57;
        const attendedClean = Math.min(attended, totalTermDays);
        const rate = totalTermDays > 0 ? Math.round((attendedClean / totalTermDays) * 100) : 100;

        return {
          term: term.name,
          rate: attendedClean === 0 ? 0 : rate,
          present: attendedClean,
          total: totalTermDays
        };
      });

      setYearlyStats(computedTerms);

    } catch (e) {
      console.error('Error generating live analytics stats:', e);
      setWeeklyRecords([
        { day: 'Mon', date: '15 Jun', status: 'Present', arrival: '07:42 WAT', departure: '14:10 WAT' },
        { day: 'Tue', date: '16 Jun', status: 'Absent', arrival: '—', departure: '—' },
        { day: 'Wed', date: '17 Jun', status: 'Present', arrival: '07:38 WAT', departure: '14:05 WAT' },
        { day: 'Thu', date: '18 Jun', status: 'Present', arrival: '07:51 WAT', departure: '14:15 WAT' },
        { day: 'Fri', date: '19 Jun', status: 'Late', arrival: '08:05 WAT', departure: '14:00 WAT' },
      ]);
      setMonthlyStats({
        presentCount: 17,
        lateCount: 2,
        absentCount: 1,
        totalDays: 20,
        percentage: '95%',
        avgCheckIn: '7:46 AM'
      });
      setYearlyStats([
        { term: 'Term 1 (Sept - Dec)', rate: 94, present: 54, total: 57 },
        { term: 'Term 2 (Jan - Apr)', rate: 97, present: 58, total: 60 },
        { term: 'Term 3 (May - Jul)', rate: 95, present: 19, total: 20 },
      ]);
    }
  };

  // Fetch parent notifications
  const loadNotifications = async (conn: boolean) => {
    setAlertsLoading(true);
    if (!conn) {
      setTimeout(() => {
        setNotifications([
          {
            id: 'notif-1',
            message: 'john doe has been safely scanned out at the Gate release zone. Hand-off completed.',
            created_at: new Date('2026-06-16T14:12:00Z').toISOString(),
            is_read: false
          },
          {
            id: 'notif-2',
            message: 'john doe was marked Present at the Gate arrival zone.',
            created_at: new Date('2026-06-16T07:44:00Z').toISOString(),
            is_read: true
          },
          {
            id: 'notif-3',
            message: 'Emergency alert: Heavy traffic detected around Zone 4 Gate due to road works. Please use alternative routes.',
            created_at: new Date('2026-06-15T08:00:00Z').toISOString(),
            is_read: true
          }
        ]);
        setAlertsLoading(false);
      }, 300);
      return;
    }

    try {
      const session = getSession();
      if (!session) return;
      const res = await fetch('/api/notifications/inbox', {
        headers: {
          'x-myeduride-session': encodeURIComponent(JSON.stringify(session))
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error('Failed to load real alerts:', e);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    if (!isDbConnected) {
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      return;
    }

    try {
      const session = getSession();
      if (!session) return;
      const res = await fetch('/api/notifications/inbox', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-myeduride-session': encodeURIComponent(JSON.stringify(session))
        },
        body: JSON.stringify({ mark_all: true })
      });
      if (res.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      }
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  // Submit custom parent pickup notification
  const handleNotifySchool = async () => {
    if (!selectedChild) return;
    if (!pickupPersonName.trim()) {
      alert('Please provide the pickup person\'s name');
      return;
    }

    setSubmittingPickup(true);

    const formattedPayload = {
      id: 'req-' + Math.random().toString(36).substr(2, 9),
      student_id: selectedChild.id,
      pickup_person_name: pickupPersonName,
      relationship: pickingUpMyself ? 'Parent' : relationship,
      created_at: new Date().toISOString(),
      status: 'pending' // matches screenshots' pending/approved workflow
    };

    if (!isDbConnected) {
      // Append to sandbox local storage
      setTimeout(() => {
        const updated = [formattedPayload, ...recentPickups];
        setRecentPickups(updated);
        localStorage.setItem('myeduride_local_dismissals', JSON.stringify(updated));
        
        // Alert to parent
        alert('Pickup notification successfully sent and registered on the gate dashboard!');
        setNoteToSchool('');
        if (!pickingUpMyself) {
          setPickupPersonName('');
        }
        setSubmittingPickup(false);
      }, 500);
      return;
    }

    try {
      const today = todayInLagos();

      // Submit and trigger email notification on server-side
      const data = await fetchData('create_dismissal_request', {
        student_id: selectedChild.id,
        school_id: selectedChild.school_id,
        pickup_person_name: pickupPersonName,
        relationship: pickingUpMyself ? 'Parent' : relationship,
        dismissal_date: today
      });

      if (data.error) throw new Error(data.error);

      // Reload real pickups from DB
      await loadRecentPickups(isDbConnected, selectedChild.id);

      alert(data.email_sent 
        ? 'Pickup notification registered successfully! Secure verification email has been sent to your email address.'
        : 'Pickup notification successfully sent and registered on the gate dashboard!'
      );
      
      setNoteToSchool('');
      if (!pickingUpMyself) {
        setPickupPersonName('');
      }
    } catch (e: any) {
      console.error('Failed to insert dismissal request:', e);
      alert('Failed to submit: ' + e.message);
    } finally {
      setSubmittingPickup(false);
    }
  };

  // Calculate initials helper
  const parentInitials = parentName
    ? parentName.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'dj';

  const unreadAlertsCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-950">
      
      {/* FULL RESPONSIVE SPLIT PAGE LAYOUT (Left sticky sidebar on Desktop, bottom nav bar on mobile) */}
      <div className="xl:max-w-7xl lg:max-w-6xl md:max-w-5xl mx-auto md:flex md:flex-row relative min-h-screen">
        
        {/* ========================================= */}
        {/* SIDEBAR FOR DESKTOP AND TABLETS */}
        {/* ========================================= */}
        <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200/50 flex-col py-8 px-6 shrink-0 relative sticky top-0 h-screen justify-between shadow-2xs z-30 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            {/* Elegant Header Branding */}
            <div>
              <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase mb-2">
                <ShieldCheck size={11} className="shrink-0" />
                <span>MYEDURIDE SECURITY</span>
              </div>
              <div className="flex items-center gap-2.5">
                <img
                  src="https://www.image2url.com/r2/default/images/1779230378321-292c7b74-6217-41ff-832a-180a535ea4cb.png"
                  alt="myEduRide logo"
                  className="w-10 h-10 object-contain rounded-xl shadow-xs"
                />
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                    <span className="text-slate-400 font-medium">my</span>
                    <span className="text-emerald-600 font-black">EduRide</span>
                  </h2>
                  <span className="text-[10px] font-bold text-slate-400/90 lowercase tracking-tight block mt-0.5">
                    student safety portal
                  </span>
                </div>
              </div>
            </div>

            {/* Logged in Parent User Badge layout */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm uppercase shrink-0">
                {parentInitials}
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider leading-none">AUTHORIZED GUARDIAN</span>
                <h3 className="text-sm font-black text-slate-800 tracking-tight truncate mt-1">
                  {parentName}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight truncate block">
                  Connected parent account
                </span>
              </div>
            </div>

            {/* Vertical menu navigation */}
            <nav className="space-y-1.5 pt-2">
              {TABS.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'alerts') {
                        loadNotifications(isDbConnected);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border-none cursor-pointer text-left ${
                      isActive 
                        ? 'bg-emerald-600 text-white shadow-custom' 
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.id === 'alerts' && unreadAlertsCount > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                        isActive ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                      }`}>
                        {unreadAlertsCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom logout and connection status */}
          <div className="space-y-4">
            <div className={`p-3 rounded-xl flex items-center gap-2 border text-[10px] font-bold uppercase tracking-wider ${
              isDbConnected 
                ? 'bg-emerald-50/20 text-emerald-700 border-emerald-100/50' 
                : 'bg-amber-50/30 text-amber-700 border-amber-100/50'
            }`}>
              <Database size={12} className={isDbConnected ? 'text-emerald-500 animate-pulse' : 'text-amber-500'} />
              <span>{isDbConnected ? 'Live Connection Linked' : 'Sandbox Demo Mode'}</span>
            </div>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition border border-slate-100 shadow-3xs cursor-pointer"
            >
              <LogOut size={14} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* ========================================= */}
        {/* MAIN BODY CONTENT WRAPPER */}
        {/* ========================================= */}
        <main className="flex-1 md:px-8 py-6 px-4 pb-20 md:pb-12 max-w-full">
          
          {/* Header Bar for Mobile (Header disappears or compacts on desktop) */}
          <div className="md:hidden flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <img
                src="https://www.image2url.com/r2/default/images/1779230378321-292c7b74-6217-41ff-832a-180a535ea4cb.png"
                alt="myEduRide logo"
                className="w-8 h-8 object-contain rounded-lg"
              />
              <div>
                <div className="text-[8px] font-black tracking-widest text-[#10b981] uppercase leading-none">MYEDURIDE SECURITY</div>
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight leading-none mt-0.5">
                  <span className="text-slate-400 font-medium">my</span>
                  <span className="text-emerald-600 font-black">EduRide</span>
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <button 
                onClick={logout}
                className="p-1 px-2.5 py-1.5 bg-white text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50/50 border border-slate-100 shadow-3xs cursor-pointer text-[10px] font-black uppercase flex items-center gap-1"
                title="Logout"
              >
                <LogOut size={12} />
                <span>Exit</span>
              </button>
            </div>
          </div>

          {/* Desktop Section Header (shows description of active section) */}
          <div className="hidden md:block mb-8 border-b border-slate-200/40 pb-5">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              AUTHORIZED GUARDIAN HUB
            </span>
            <div className="flex items-center justify-between mt-1.5">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {TABS.find(t => t.id === activeTab)?.label}
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  {TABS.find(t => t.id === activeTab)?.description}
                </p>
              </div>
              <div className="flex items-center gap-3.5">
                {/* Profile Badge Link */}
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2.5 bg-slate-50/70 border border-slate-200/50 rounded-xl px-3 py-1.8 cursor-pointer hover:bg-slate-100/70 transition-all shadow-3xs hover:border-slate-300"
                  title="Account Settings & Reset Password"
                >
                  <div className="w-6.5 h-6.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center uppercase shrink-0">
                    {parentInitials}
                  </div>
                  <div className="text-left hidden lg:block select-none max-w-[120px]">
                    <h4 className="text-[10.5px] font-black text-slate-800 leading-none truncate">{parentName}</h4>
                    <span className="text-[8px] text-emerald-600 uppercase tracking-widest font-extrabold block mt-0.5 leading-none">Parent/Guardian</span>
                  </div>
                </div>

                {/* Sign Out Button (BESIDE the profile at the top right!) */}
                <button
                  onClick={logout}
                  className="px-3.5 py-1.8 hover:bg-rose-50 border border-slate-200/50 hover:border-rose-200 text-slate-600 hover:text-rose-600 rounded-xl text-[10.5px] font-black uppercase flex items-center gap-1.5 transition-all shadow-3xs cursor-pointer min-h-[38px] bg-white text-center"
                >
                  <LogOut size={13} />
                  <span>Exit Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================= */}
          {/* ACTIVE TAB STAGE GRID CONTENT */}
          {/* ========================================= */}
          <AnimatePresence mode="wait">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 min-h-[300px]" id="loading-box">
                <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-bold mt-4 tracking-wide">Retrieving student directories...</p>
              </div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="space-y-6"
              >
                
                {/* --------------------------------- */}
                {/* TAB 1: MY KIDS (Desktop Grid optimized) */}
                {/* --------------------------------- */}
                {activeTab === 'kids' && (
                  <div className="space-y-6" id="view-my-kids">
                    <div className="md:hidden">
                      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Your registered children</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pb-4">
                      {children.map((child) => (
                        <div 
                          key={child.id}
                          className="bg-white rounded-[24px] border border-slate-200/40 shadow-xs hover:shadow-md hover:border-slate-300/80 transition-all p-6 flex flex-col justify-between group relative overflow-hidden"
                          id={`child-card-${child.id}`}
                        >
                          {/* Colored Accent strip derived dynamically */}
                          <div 
                            className="absolute top-0 left-0 right-0 h-1.5" 
                            style={{ backgroundColor: child.school?.primary_color || '#10b981' }}
                          />

                          <div className="flex items-center gap-4">
                            {/* solid dark round profile matching high fidelity design */}
                            <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 bg-slate-900 border border-slate-100 flex items-center justify-center text-white font-extrabold text-lg shadow-inner group-hover:scale-105 transition-transform duration-350">
                              {child.first_name?.[0]?.toUpperCase() || 'S'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-black text-[#10b981] uppercase tracking-wider block truncate" title={child.school?.name || 'Metagen Academy'}>
                                {child.school?.name || 'Metagen Academy'}
                              </span>
                              <h3 className="text-lg font-black text-slate-800 capitalize tracking-tight mt-0.5 group-hover:text-emerald-700 transition-colors leading-tight truncate" title={`${child.first_name} ${child.last_name}`}>
                                {child.first_name} {child.last_name}
                              </h3>
                              <p className="text-xs text-slate-500 font-bold tracking-tight mt-0.5 truncate" title={child.class_name || 'General'}>
                                Class: {child.class_name || 'General'}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-slate-100 mt-5 pt-4 flex flex-wrap items-center justify-between gap-2">
                            <div className="bg-slate-50 border border-slate-100 px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5 max-w-full overflow-hidden">
                              <span className="text-slate-350 shrink-0">CARD ID</span>
                              <span className="truncate">{child.student_id_number || 'STU-F950-MQBSEC90'}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-slate-50/50 px-2.5 py-1 rounded-lg border border-slate-100 shrink-0">
                              <UserCheck size={12} className="text-emerald-500" />
                              <span className="capitalize">{child.relationship || 'Guardian'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Premium informational cards below list */}
                    <div className="bg-gradient-to-r from-emerald-950 to-slate-950 rounded-2xl text-white p-6 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between border border-slate-900">
                      <div className="space-y-1.5 text-center md:text-left">
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#10b981]">AUTOMATED DISMISSAL PLATFORM</h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-semibold max-w-xl">
                          Every scan on our specialized RFID gate readers synchronizes updates to this portal in real-time. Make sure to announce check-out arrangements ahead of school closure.
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('pickup')} 
                        className="bg-white hover:bg-slate-100 text-slate-950 px-4 py-2 text-xs font-black uppercase rounded-xl transition flex items-center gap-2 border-none shrink-0 cursor-pointer"
                      >
                        <span>Schedule Pickup</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {/* --------------------------------- */}
                {/* TAB 2: HISTORY (Separated Grid layout) */}
                {/* --------------------------------- */}
                {activeTab === 'history' && (
                  <div className="space-y-6" id="view-history">
                    
                    {/* TOP ACTION SECTION & FILTERS SPLIT (Responsive layout) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left: Controls selection pane (4 columns width) */}
                      <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/40 p-5 space-y-5 shadow-xs">
                        <div>
                          <h3 className="font-black text-slate-900 text-sm tracking-tight">Aesthetic Filters</h3>
                          <p className="text-xs text-slate-400 mt-1 font-medium">Select child and log cycle windows to view records.</p>
                        </div>

                        {/* Child Selector */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Choose Child</label>
                          <div className="relative">
                            <select
                              value={selectedChild?.id || ''}
                              onChange={(e) => setSelectedChild(children.find(c => c.id === e.target.value))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:border-slate-300 cursor-pointer focus:ring-2 focus:ring-emerald-600/10"
                            >
                              {children.map(c => (
                                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                          </div>
                        </div>

                        {/* Cycle Filters Pills */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase text-slate-455 tracking-wider">Log Scope</label>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((filter) => {
                              const isActive = historyFilter === filter;
                              return (
                                <button
                                  key={filter}
                                  onClick={() => setHistoryFilter(filter)}
                                  className={`py-2 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-wider text-center border-none cursor-pointer ${
                                    isActive 
                                      ? 'bg-white text-emerald-600 shadow-xs' 
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  {filter}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Date selection (only relevant for Daily filter or general search) */}
                        {historyFilter === 'Daily' && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-slate-460 tracking-wider">Specific Date</label>
                            <div className="relative">
                              <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer pr-10 text-center uppercase tracking-wide"
                              />
                              <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Detailed report pane (8 columns width) */}
                      <div className="lg:col-span-8 space-y-4">
                        
                        {/* Daily Display View (default) */}
                        {historyFilter === 'Daily' && (
                          <div className="bg-white rounded-[28px] border border-slate-200/40 p-6 shadow-xs relative overflow-hidden" id="attendance-detail-box">
                            
                            {/* Decorative soft dynamic indicator dot */}
                            <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-10 rounded-full ${
                              attendanceRecord?.status === 'Absent' ? 'bg-rose-500' : 'bg-emerald-500'
                            }`} />

                            {historyLoading ? (
                              <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs text-slate-400 font-bold mt-3">Fetching logs...</p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                  <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">
                                      {selectedChild?.first_name} {selectedChild?.last_name}
                                    </span>
                                    <h4 className="text-xs font-bold text-slate-500 mt-1">
                                      Attendance status for {selectedDate}
                                    </h4>
                                  </div>
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    attendanceRecord?.status === 'Absent' 
                                      ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>
                                    {attendanceRecord?.status || 'Absent'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  
                                  {/* Check-In Card */}
                                  <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-2xl flex items-center gap-3.5">
                                    <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                                      <Clock size={16} />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Arrival / Check-In</span>
                                      <h5 className="text-base font-black text-slate-900 mt-0.5">
                                        {attendanceRecord?.check_in || '—'}
                                      </h5>
                                    </div>
                                  </div>

                                  {/* Check-Out Card */}
                                  <div className="bg-slate-50/60 border border-slate-100 p-5 rounded-2xl flex items-center gap-3.5">
                                    <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                      <LogOut size={16} />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Departure / Check-out</span>
                                      <h5 className="text-base font-black text-slate-900 mt-0.5">
                                        {attendanceRecord?.check_out || '—'}
                                      </h5>
                                    </div>
                                  </div>

                                </div>

                                <div className="bg-[#f0fdf4]/50 border border-emerald-100/30 rounded-xl p-4 flex items-start gap-3">
                                  <AlertCircle size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                                  <p className="text-[10px] text-emerald-800 leading-normal font-semibold">
                                    Please report check-in discrepancies directly to the school administration using the portal help desk. Always keep child safety tags secure.
                                  </p>
                                </div>

                              </div>
                            )}
                          </div>
                        )}

                        {/* Weekly view (advanced desktop layout) */}
                        {historyFilter === 'Weekly' && (
                          <div className="bg-white rounded-[28px] border border-slate-200/40 p-6 shadow-xs space-y-5">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Weekly report breakdown: {selectedChild?.first_name}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400">
                                Week of {weeklyRecords[0] ? `${weeklyRecords[0].date} ${new Date(selectedDate).getFullYear()}` : 'Selected Date'}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {weeklyRecords.map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/25 hover:bg-slate-50/60 transition">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 text-center">
                                      <span className="text-xs font-black text-slate-800 block">{item.day}</span>
                                      <span className="text-[10px] text-slate-400 font-semibold">{item.date}</span>
                                    </div>
                                    <div className="h-6 w-0.5 bg-slate-100" />
                                    <div className="text-slate-500 text-xs">
                                      {item.status === 'Absent' ? (
                                        <span className="text-slate-400 font-semibold">Off school</span>
                                      ) : (
                                        <div className="font-mono text-[10px] space-y-0.5">
                                          <div>In: <span className="font-bold text-slate-700">{item.arrival}</span></div>
                                          <div>Out: <span className="font-bold text-slate-700">{item.departure}</span></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                    item.status === 'Absent' 
                                      ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                                      : item.status === 'Late'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>
                                    {item.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Monthly View */}
                        {historyFilter === 'Monthly' && monthlyStats && (
                          <div className="bg-white rounded-[28px] border border-slate-200/40 p-6 shadow-xs space-y-6">
                            <div className="border-b border-slate-100 pb-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Monthly Attendance Summary
                              </h4>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Present</span>
                                <span className="text-2xl font-black text-emerald-600 block mt-1">{monthlyStats.presentCount}</span>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Late Arrivals</span>
                                <span className="text-2xl font-black text-amber-600 block mt-1">{monthlyStats.lateCount}</span>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Absent</span>
                                <span className="text-2xl font-black text-rose-600 block mt-1">{monthlyStats.absentCount}</span>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                                <span className="text-2xl font-black text-slate-900 block mt-1">{monthlyStats.percentage}</span>
                              </div>
                            </div>

                            <div className="bg-[#f8fafc] border border-slate-200 p-4 rounded-xl flex justify-between items-center text-xs text-slate-500">
                              <span className="font-bold">Average Check-in (WAT)</span>
                              <span className="font-mono font-black text-slate-800">{monthlyStats.avgCheckIn}</span>
                            </div>
                          </div>
                        )}

                        {/* Yearly view */}
                        {historyFilter === 'Yearly' && (
                          <div className="bg-white rounded-[28px] border border-slate-200/40 p-6 shadow-xs space-y-5">
                            <div className="border-b border-slate-100 pb-3">
                              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                Termly performance statistics
                              </h4>
                            </div>

                            <div className="space-y-4">
                              {yearlyStats.map((item, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-slate-700">{item.term}</span>
                                    <span className="text-emerald-600 font-extrabold">{item.rate}% Rate</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                                      style={{ width: `${item.rate}%` }}
                                    />
                                  </div>
                                  <span className="text-[9px] text-slate-400 block font-semibold uppercase">
                                    {item.present} sessions attended out of {item.total} academic days
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                  </div>
                )}

                {/* --------------------------------- */}
                {/* TAB 3: PICKUP (Split screen on Desktop) */}
                {/* --------------------------------- */}
                {activeTab === 'pickup' && (
                  <div className="space-y-6" id="view-pickup">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      
                      {/* Left: Pickup Request Form (col-span-7) */}
                      <div className="lg:col-span-7 bg-white rounded-[28px] border border-slate-250/20 shadow-xs p-6 space-y-5">
                        <div>
                          <h3 className="font-black text-slate-900 text-sm md:text-base leading-tight">Different person today?</h3>
                          <p className="text-xs text-slate-400 mt-1.5 leading-normal font-medium">
                            If someone not on your authorised permanent list will pick up today, notify school authorities and gate dispatch officers below.
                          </p>
                        </div>

                        {/* Form Controls */}
                        <div className="space-y-4">
                          
                          {/* Child dropdown selector */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Child</label>
                            <div className="relative">
                              <select
                                value={selectedChild?.id || ''}
                                onChange={(e) => setSelectedChild(children.find(c => c.id === e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-750 appearance-none focus:outline-none focus:border-slate-300 cursor-pointer"
                              >
                                {children.map(c => (
                                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                          </div>

                          {/* Custom Checkbox - "I am picking up myself" */}
                          <label className="flex items-center gap-2.5 cursor-pointer select-none py-1 group w-fit">
                            <input
                              type="checkbox"
                              checked={pickingUpMyself}
                              onChange={(e) => setPickingUpMyself(e.target.checked)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-200 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                              I will pickup the child myself today
                            </span>
                          </label>

                          {/* Pickup Person's Name Input/Dropdown */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Authorized Person Name</label>
                            {pickingUpMyself ? (
                              <input
                                type="text"
                                value={pickupPersonName}
                                disabled
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 cursor-not-allowed uppercase"
                              />
                            ) : authPersonsLoading ? (
                              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-400 font-bold flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Loading authorized parent list...</span>
                              </div>
                            ) : authorizedPersons.length === 0 ? (
                              <div className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-4 py-3 text-xs font-bold text-rose-700">
                                No permanent authorized pickup persons found for {selectedChild?.first_name}. Please contact the school to register.
                              </div>
                            ) : (
                              <div className="relative">
                                <select
                                  value={pickupPersonName}
                                  onChange={(e) => {
                                    const name = e.target.value;
                                    setPickupPersonName(name);
                                    const match = authorizedPersons.find(p => p.name === name);
                                    if (match) {
                                      setRelationship(match.relationship || 'Guardian');
                                    }
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 appearance-none focus:outline-none focus:border-emerald-500 cursor-pointer"
                                >
                                  <option value="">-- Choose Authorized Guardian --</option>
                                  {authorizedPersons.map((p) => (
                                    <option key={p.id} value={p.name}>
                                      {p.name} ({p.relationship})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                              </div>
                            )}
                          </div>

                          {/* Relationship Input - Visible only if not self */}
                          {!pickingUpMyself && (
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Relationship to Student</label>
                              <input
                                type="text"
                                value={relationship}
                                disabled
                                placeholder="Select an authorized guardian first"
                                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-500 cursor-not-allowed uppercase"
                              />
                            </div>
                          )}

                          {/* Notes to School input */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Note to school / gate officer (optional)</label>
                            <textarea
                              rows={3}
                              value={noteToSchool}
                              onChange={(e) => setNoteToSchool(e.target.value)}
                              placeholder="e.g. Black Toyota, presenting ID at gate reception, etc..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 resize-none leading-normal"
                            />
                          </div>

                          {/* Action Submission */}
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={handleNotifySchool}
                              disabled={submittingPickup}
                              className="w-full py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase text-center flex items-center justify-center gap-2 border-none cursor-pointer transition shadow-sm disabled:opacity-50"
                            >
                              <Send size={14} />
                              <span>{submittingPickup ? 'Submitting...' : 'Send Notification'}</span>
                            </button>
                            <p className="text-[9px] text-slate-400 text-center leading-normal mt-2.5 max-w-[280px] mx-auto">
                              Alerts school and gate officers immediately. Active record list targets present calendar days.
                            </p>
                          </div>

                        </div>
                      </div>

                      {/* Right: Sent today / recently logs (col-span-5) */}
                      <div className="lg:col-span-5 space-y-4" id="pickup-logs">
                        <div className="flex items-center justify-between border-b border-slate-200/40 pb-2">
                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                            Sent today / recently
                          </span>
                        </div>

                        {recentPickups.length === 0 ? (
                          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center italic text-xs text-slate-400 font-medium">
                            No dispatch clearances found on profile.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {recentPickups.map((log) => (
                              <div 
                                key={log.id}
                                className="bg-white rounded-2xl border border-slate-250/20 p-4 flex justify-between items-center shadow-3xs hover:border-slate-350 hover:shadow-2xs transition-all"
                              >
                                <div className="space-y-1">
                                  <p className="text-xs font-black text-slate-800 capitalize leading-none">
                                    {log.pickup_person_name}
                                  </p>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                                    {log.relationship || 'Guardian'} • {new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                  </span>
                                </div>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-widest">
                                  {log.status || 'Sent'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}

                {/* --------------------------------- */}
                {/* TAB 4: ALERTS (Standard alert feed) */}
                {/* --------------------------------- */}
                {activeTab === 'alerts' && (
                  <div className="space-y-4" id="view-alerts">
                    {alertsLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 min-h-[300px]">
                        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-slate-400 font-bold mt-3">Fetching alert logs...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="bg-white rounded-[28px] border border-slate-100 shadow-xs py-16 px-6 text-center flex flex-col justify-center items-center h-full min-h-[300px]">
                        <div className="p-4.5 bg-slate-50 rounded-full text-slate-300 inline-block">
                          <Bell className="mx-auto" size={36} />
                        </div>
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest block mt-4">
                          No notifications yet
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-[255px] text-center leading-normal font-medium">
                          When your child is scanned in at school, or safely checked out by a driver, live alerts appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Live notifications feed
                          </span>
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="bg-transparent border-none text-[10px] font-semibold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider cursor-pointer"
                          >
                            Mark All as Read
                          </button>
                        </div>

                        <div className="space-y-3 pb-8">
                          {notifications.map((notif) => (
                            <div 
                              key={notif.id}
                              className={`bg-white rounded-2xl border p-5 shadow-3xs flex items-start gap-4 transition-all ${
                                notif.is_read ? 'border-slate-100 opacity-70' : 'border-emerald-150/40 bg-emerald-50/5 hover:bg-emerald-50/10'
                              }`}
                            >
                              <div className={`p-2 rounded-xl shrink-0 ${
                                notif.is_read ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                <Bell size={16} className={notif.is_read ? '' : 'animate-bounce'} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-slate-700 leading-normal">
                                  {notif.message}
                                </p>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                                  {new Date(notif.created_at).toLocaleDateString('en-GB')} • {new Date(notif.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ---------------------------------- */}
                {/* TAB 5: PROFILE SETTINGS */}
                {/* ---------------------------------- */}
                {activeTab === 'profile' && (
                  <div className="space-y-6 text-left" id="view-profile">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Profile details editor */}
                      <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-3xs space-y-4 text-left">
                        <legend className="font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-2 border-b border-slate-50 pb-2 font-sans">Modify Guardian Identity Details</legend>
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                          {profileSuccess && <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl font-bold font-sans">{profileSuccess}</div>}
                          {profileError && <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl font-bold font-sans">{profileError}</div>}
                          
                          {/* Photo Avatar Live Upload */}
                          <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-50 pb-4 mb-2">
                            <div className="relative shrink-0">
                              <StudentAvatar photoUrl={photoBase64 || parentPhotoUrl} firstName={parentName} size={70} />
                              {photoBase64 && (
                                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white font-extrabold text-[8px] uppercase px-1.5 py-0.5 rounded-full border border-white">
                                  Pending
                                </span>
                              )}
                            </div>
                            <div className="space-y-1 sm:text-left text-center">
                              <h4 className="text-xs font-black text-slate-800">Guardian Profile Image</h4>
                              <p className="text-[10px] text-slate-400">Upload a portrait. Verified by officers during real student pickup.</p>
                              
                              <div className="flex items-center gap-2 pt-1">
                                <label className="cursor-pointer bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1">
                                  <span>Choose File</span>
                                  <input 
                                    type="file" 
                                    accept="image/png, image/jpeg, image/jpg" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setPhotoBase64(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                </label>
                                {photoBase64 && (
                                  <button
                                    type="button"
                                    onClick={() => setPhotoBase64(null)}
                                    className="text-red-500 hover:text-red-750 text-[10px] font-bold"
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Guardian Full Name</label>
                              <input
                                type="text"
                                value={parentName}
                                onChange={(e) => setParentName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500/30 min-h-[44px]"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Guardian Relationship / Title</label>
                              <select
                                value={parentTitle}
                                onChange={(e) => setParentTitle(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-850 focus:outline-none focus:border-emerald-500/30 min-h-[44px]"
                              >
                                <option value="Mother">Mother</option>
                                <option value="Father">Father</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Driver">Authorized Driver</option>
                                <option value="Uncle">Uncle</option>
                                <option value="Aunt">Aunt</option>
                                <option value="Other">Other / Extended Family</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Portal Username</label>
                              <input
                                type="text"
                                readOnly
                                value={session?.username || ''}
                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 focus:outline-none min-h-[44px] cursor-not-allowed font-mono"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                              <input
                                type="email"
                                readOnly
                                value={session?.email || ''}
                                className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 focus:outline-none min-h-[44px] cursor-not-allowed font-sans"
                              />
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="submit"
                              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-3xs cursor-pointer border-none min-h-[44px]"
                            >
                              Save Profile & Identity
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Reset self password card */}
                      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-3xs text-left space-y-4">
                        <legend className="font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-2 border-b border-slate-50 pb-2 font-sans">Change Guardian Security Password</legend>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                          Update your authorized parent credentials. Keep this gateway passcode safe and unique.
                        </p>
                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                          {pwdError && <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl font-bold font-sans">{pwdError}</div>}
                          {pwdSuccess && <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl font-bold font-sans">{pwdSuccess}</div>}
                          
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">New Security Password</label>
                            <input
                              type="password"
                              value={pwdNew}
                              onChange={(e) => setPwdNew(e.target.value)}
                              placeholder="Minimum 6 characters"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500/30 min-h-[44px]"
                            />
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm Password Link</label>
                            <input
                              type="password"
                              value={pwdConfirm}
                              onChange={(e) => setPwdConfirm(e.target.value)}
                              placeholder="Confirm security password"
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-emerald-500/30 min-h-[44px]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={pwdLoading}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-3xs cursor-pointer min-h-[44px] border-none animate-none"
                          >
                            {pwdLoading ? 'Saving lock...' : 'Update Guardian Password'}
                          </button>
                        </form>
                      </div>

                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </main>
      </div>

      {/* ========================================= */}
      {/* MOBILE BOTTOM NAVIGATION BAR */}
      {/* ========================================= */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200/50 pb-safe-bottom shadow-lg z-40">
        <div className="max-w-md mx-auto py-2.5 px-6 flex justify-around items-center">
          {TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'alerts') {
                    loadNotifications(isDbConnected);
                  }
                }}
                className="flex flex-col items-center gap-1 cursor-pointer relative py-1 focus:outline-none border-none bg-transparent"
                style={{ width: '22%' }}
                id={`tab-button-${tab.id}`}
              >
                {/* Active Indicator Dot */}
                {isActive && (
                  <motion.div 
                    layoutId="active-dot"
                    className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-emerald-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                )}
                
                <IconComponent 
                  className={`transition-colors ${isActive ? 'text-emerald-650 text-emerald-600' : 'text-slate-400 hover:text-slate-500'}`} 
                  size={19} 
                />
                
                <span className={`text-[10px] font-extrabold tracking-tight transition-colors ${
                  isActive ? 'text-emerald-650 text-emerald-600' : 'text-slate-400 hover:text-slate-500'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
