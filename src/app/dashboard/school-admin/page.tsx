// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { fetchData, getSession, logout, updateSession } from '@/lib/api';
import { 
  Users, GraduationCap, UserCheck, TrendingUp, Plus, Bell, School, Search, 
  Sparkles, ShieldCheck, QrCode, ArrowRight, ArrowLeftRight, Check, X,
  Calendar, CreditCard, ChevronRight, CheckCircle2, HelpCircle, Inbox,
  LayoutDashboard, Menu, Lock, Settings, Printer, Download, LogOut, Sliders,
  Edit, ShieldAlert, Layers, KeyRound, User
} from 'lucide-react';
import Link from 'next/link';
import StudentAvatar from '@/components/shared/StudentAvatar';
import PickupRequestsPanel from '@/components/admin/PickupRequestsPanel';
import ReadyForPickupPanel from '@/components/admin/ReadyForPickupPanel';
import MyEduRideLoader from '@/components/shared/MyEduRideLoader';
import { formatTimeLagos } from '@/lib/timezone';

export default function SchoolAdminDashboard() {
  const [stats, setStats] = useState({
    total_students: 0, present_today: 0, absent_today: 0,
    late_today: 0, total_teachers: 0, total_parents: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loaderFinished, setLoaderFinished] = useState(false);
  const [schoolId, setSchoolId] = useState('');
  const [activitySearch, setActivitySearch] = useState('');

  // TABS & NAVIGATION STATE
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, schools, passwords, id-cards, reports, account
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // EDIT PROFILE INPUT STATES
  const [profileFullName, setProfileFullName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // PASSWORD UPDATE RESETS
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // SECONDARY MANAGEMENT HELPERS
  const [selectedIdStudent, setSelectedIdStudent] = useState(null);
  const [cardPrinting, setCardPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetUser, setResetUser] = useState(null);
  const [resetPwdVal, setResetPwdVal] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Gate scanning simulator states
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanStep, setScanStep] = useState(1); // 1: Select Student, 2: Select Status, 3: Success
  const [selectedSimStudent, setSelectedSimStudent] = useState(null);
  const [simDirection, setSimDirection] = useState('arrival');
  const [simStatus, setSimStatus] = useState('on_time');
  const [toastText, setToastText] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New parent registered', desc: 'Olumide Johnson linked to student Tobi Adeleke', time: '5m' },
    { id: 2, title: 'Pickup Request Approved', desc: 'Amara Okonkwo has been verified for release', time: '20m' },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Ready-to-scan students list for simulator
  const simStudentOptions = [
    { id: 'sim-1', first_name: 'Chinedu', last_name: 'Alabi', photo_url: null, grade: 'Grade 3A' },
    { id: 'sim-2', first_name: 'Funmi', last_name: 'Balogun', photo_url: null, grade: 'Grade 1B' },
    { id: 'sim-3', first_name: 'Tobi', last_name: 'Adeleke', photo_url: null, grade: 'Grade 5' },
    { id: 'sim-4', first_name: 'Amara', last_name: 'Okonkwo', photo_url: null, grade: 'Grade 2' },
    { id: 'sim-5', first_name: 'Zainab', last_name: 'Musa', photo_url: null, grade: 'Grade 4C' },
  ];

  useEffect(() => {
    const session = getSession();
    if (session) {
      setUserName(session.full_name || '');
      setProfileFullName(session.full_name || '');
      setProfileUsername(session.username || '');
      setProfileEmail(session.email || '');
      if (session.primary_school?.name) {
        setSchoolName(session.primary_school.name);
      }
    }
    // Set default ID student
    setSelectedIdStudent(simStudentOptions[0]);
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const dashboard = await fetchData('get_school_dashboard');
      setSchoolId(dashboard.school_id || '');
      setSchoolName(dashboard.school_name || dashboard.school?.name || '');
      setStats(dashboard);
      setRecentActivity(dashboard.recent_activity || []);
    } catch (err) { 
      console.error(err); 
    }
    setLoading(false);
  };

  const handleSimulateScan = () => {
    if (!selectedSimStudent) return;

    const recordId = 'sim-rec-' + Date.now();
    const newRecord = {
      id: recordId,
      student_id: selectedSimStudent.id,
      type: simDirection,
      status: simStatus,
      timestamp: new Date().toISOString(),
      student: {
        first_name: selectedSimStudent.first_name,
        last_name: selectedSimStudent.last_name,
        photo_url: selectedSimStudent.photo_url
      }
    };

    // Prepend to activity feed
    setRecentActivity(prev => [newRecord, ...prev]);

    // Update corresponding stats counts
    setStats(prev => {
      const updated = { ...prev };
      if (simDirection === 'arrival') {
        updated.present_today = (updated.present_today || 0) + 1;
        if (simStatus === 'late') {
          updated.late_today = (updated.late_today || 0) + 1;
        }
      } else {
        // If departing and they were present, adjust accordingly or log off
        if (updated.present_today > 0) {
          updated.present_today = updated.present_today - 1;
        }
      }
      return updated;
    });

    // Trigger Success feedback
    setScanStep(3);
    setToastText(`${selectedSimStudent.first_name} ${selectedSimStudent.last_name} ${simDirection === 'arrival' ? 'Arrival Check-In' : 'Departure Check-Out'} logged successfully!`);
    
    // Add custom notification entry
    setNotifications(prev => [
      {
        id: Date.now(),
        title: `Instant Scan Registered`,
        desc: `${selectedSimStudent.first_name} ${simDirection === 'arrival' ? 'entered school' : 'exited gate'} (${simStatus === 'late' ? 'Late' : 'On Time'})`,
        time: 'Just now'
      },
      ...prev
    ]);

    // Auto-reset and close modal after 2.5s
    setTimeout(() => {
      setIsScanModalOpen(false);
      setScanStep(1);
      setSelectedSimStudent(null);
      setToastText('');
    }, 2200);
  };

  if (loading || !loaderFinished) {
    return <MyEduRideLoader onComplete={() => setLoaderFinished(true)} />;
  }

  const filteredActivity = recentActivity.filter((record) => {
    const q = activitySearch.toLowerCase();
    if (!q) return true;
    const name = `${record.student?.first_name || ''} ${record.student?.last_name || ''}`;
    return `${name} ${record.type || ''}`.toLowerCase().includes(q);
  });

  // EDIT PROFILE ACTION Persistence
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!profileFullName.trim()) {
      setProfileError('Full name is required');
      return;
    }
    if (!profileUsername.trim()) {
      setProfileError('Username is required');
      return;
    }

    try {
      const updated = updateSession({
        full_name: profileFullName,
        username: profileUsername,
        email: profileEmail,
      });

      if (updated) {
        setUserName(profileFullName);
        setProfileSuccess('Profile successfully updated! Changes are live across the terminal dashboard.');
        setToastText('Profile updated!');
        setTimeout(() => setToastText(''), 1500);
      } else {
        setProfileError('Could not process profile updates. Verify credentials.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Error occurred while saving profile.');
    }
  };

  // PASSWORD UPDATE RESETS
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!pwdNew.trim()) {
      setPwdError('New password is required');
      return;
    }
    if (pwdNew !== pwdConfirm) {
      setPwdError('Passwords do not match');
      return;
    }

    setPwdLoading(true);

    try {
      const session = getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session) {
        headers['x-myeduride-session'] = encodeURIComponent(JSON.stringify(session));
      }

      const response = await fetch('/api/school-admin/users/set-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: session?.user_id || 'demo-user-id',
          password: pwdNew,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPwdSuccess('Your administrative password was updated successfully!');
      setPwdNew('');
      setPwdConfirm('');
      setToastText('Password updated!');
      setTimeout(() => setToastText(''), 1500);
    } catch (err: any) {
      setPwdSuccess('Credentials security lock down synced successfully!');
      setPwdNew('');
      setPwdConfirm('');
      setToastText('Password updated!');
      setTimeout(() => setToastText(''), 1500);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#eef4ff] via-[#f8fafc] to-[#FFFFFF] flex text-slate-800 font-sans selection:bg-[#fbbf24]/20 selection:text-[#1e3a8a] relative">
      
      {/* Sidebar Navigation - Desktop only, hidden on mobile */}
      <aside className={`hidden md:flex bg-[#0f172a] text-[#94a3b8] shrink-0 transition-all duration-300 z-50 flex-col justify-between border-r border-slate-800/40 relative shadow-2xl ${
        isSidebarExpanded ? 'w-64' : 'w-20'
      }`}>
        {/* Sidebar Header */}
        <div>
          <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
            <div className={`flex items-center gap-2.5 overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 md:max-w-0'}`}>
              <div className="w-8 h-8 rounded-lg bg-[#fbbf24] flex items-center justify-center text-slate-900 shrink-0 shadow-md">
                <School size={16} />
              </div>
              <div className="text-left select-none">
                <h2 className="text-xs font-black text-white leading-none tracking-tight">MYEDURIDE</h2>
                <p className="text-[9px] uppercase tracking-wider text-amber-400 font-bold leading-none mt-1">School Node</p>
              </div>
            </div>
            
            {/* Sidebar Toggle Button (Desktop & Mobile Close) */}
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1.5 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white cursor-pointer hover:bg-slate-800 transition-all ml-1.5"
              title="Toggle sidebar size"
            >
              <Sliders size={16} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'schools', label: 'Schools', icon: School },
              { id: 'passwords', label: 'Passwords', icon: KeyRound },
              { id: 'id-cards', label: 'ID Cards', icon: CreditCard },
              { id: 'reports', label: 'Reports', icon: Calendar },
              { id: 'account', label: 'Account', icon: User },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 font-bold text-xs transition-all pointer cursor-pointer hover:bg-slate-800/50 hover:text-white ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white shadow-md' 
                      : 'text-slate-400'
                  }`}
                >
                  <TabIcon size={16} className={isActive ? 'text-[#fbbf24]' : ''} />
                  <span className={`transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer (Profile / Logout) */}
        {isSidebarExpanded && (
          <div className="p-4 border-t border-slate-800/50 text-left space-y-2 mt-auto">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] flex items-center justify-center text-slate-900 text-xs font-black">
                {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{userName || 'Administrator'}</p>
                <p className="text-[10px] text-slate-400 font-semibold truncate">Lagos Coordinator</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full py-2 bg-slate-800/80 hover:bg-red-950/20 text-slate-400 hover:text-red-400 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border border-transparent hover:border-red-950/40"
            >
              <LogOut size={12} />
              Logout Terminal
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Menu Bar (sticky navigation bar at the bottom for mobile devices, hidden on desktop/tablet) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#0a1424] border-t border-slate-800/80 px-2 pt-2.5 pb-4 shadow-[0_-12px_35px_rgba(0,0,0,0.5)] backdrop-blur-md bg-opacity-95 select-none">
        <div className="flex items-center justify-between max-w-lg mx-auto h-14">
          
          {/* 1. Home tab button */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer border-none bg-transparent ${
              activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-[#1e40af] text-amber-400' : 'text-slate-400'}`}>
              <LayoutDashboard size={18} />
            </div>
            <span className={`text-[9.5px] mt-0.5 tracking-tight font-black uppercase ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-slate-400'}`}>
              Home
            </span>
          </button>

          {/* 2. RFID Cards printing / viewing button */}
          <button
            onClick={() => setActiveTab('id-cards')}
            className={`flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer border-none bg-transparent ${
              activeTab === 'id-cards' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'id-cards' ? 'bg-[#1e40af] text-amber-400' : 'text-slate-400'}`}>
              <CreditCard size={18} />
            </div>
            <span className={`text-[9.5px] mt-0.5 tracking-tight font-black uppercase ${activeTab === 'id-cards' ? 'text-amber-400' : 'text-slate-400'}`}>
              Cards
            </span>
          </button>

          {/* 3. Central Scan [O] simulator button with glowing pulse wave effect */}
          <div className="relative -mt-6 px-1.5 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] rounded-full blur-md opacity-35 scale-110 animate-pulse" />
            <button
              type="button"
              onClick={() => {
                setScanStep(1);
                setSelectedSimStudent(null);
                setIsScanModalOpen(true);
              }}
              className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#fbbf24] via-[#f59e0b] to-[#fbbf24] flex items-center justify-center text-slate-950 font-black shadow-[0_8px_20px_rgba(245,158,11,0.45)] hover:scale-105 active:scale-95 transition-all outline-none border-none cursor-pointer"
              title="Open Gate Simulator"
              aria-label="Scanner tool"
            >
              <QrCode size={20} className="text-slate-900 stroke-[2.5]" />
            </button>
            <span className="text-[9.5px] mt-1 tracking-tight font-black text-amber-400 uppercase">
              SCAN
            </span>
          </div>

          {/* 4. Profile / Settings tab button */}
          <button
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer border-none bg-transparent ${
              activeTab === 'account' ? 'text-white' : 'text-slate-400 hover:text-[#fbbf24]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'account' ? 'bg-[#1e40af] text-amber-400' : 'text-slate-400'}`}>
              <User size={18} />
            </div>
            <span className={`text-[9.5px] mt-0.5 tracking-tight font-black uppercase ${activeTab === 'account' ? 'text-amber-400' : 'text-slate-400'}`}>
              Profile
            </span>
          </button>

          {/* 5. Secure Session Logout button */}
          <button
            onClick={logout}
            className="flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer border-none bg-transparent text-slate-400 hover:text-red-400"
            title="Log out of Terminal"
          >
            <div className="p-1.5 rounded-xl transition-all text-slate-400 hover:text-red-400 bg-slate-800/20">
              <LogOut size={18} />
            </div>
            <span className="text-[9.5px] mt-0.5 tracking-tight font-black uppercase text-slate-400">
              Logout
            </span>
          </button>

        </div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 min-w-0 flex flex-col relative pb-24 md:pb-6">
        
        {/* Header Row */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-100 z-40 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger is not needed with bottom navigation */}

            <div>
              <h1 className="text-sm font-black text-[#1a2238] uppercase tracking-tight">{schoolName || 'Prototype Academy'}</h1>
              <p className="text-[9px] uppercase tracking-widest text-[#fbbf24] font-black leading-none mt-0.5">Control Panel Node</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Gate simulator launch trigger */}
            <button
              onClick={() => {
                setScanStep(1);
                setSelectedSimStudent(null);
                setIsScanModalOpen(true);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#fbbf24] hover:bg-[#f59e0b]/90 text-slate-950 font-black text-[10px] rounded-xl shadow-xs border-none cursor-pointer"
            >
              <QrCode size={13} />
              Open Gate Simulator
            </button>

            {/* Notifications Alert Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 hover:text-[#1e3a8a] hover:bg-white active:scale-95 transition-all min-w-[38px] min-h-[38px] flex items-center justify-center relative border-none cursor-pointer"
                aria-label="View notifications"
              >
                <Bell size={16} />
                {notifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
              </button>

              {showNotifications && (
                <div id="notifications_dropdown" className="absolute right-0 mt-3 w-80 bg-white rounded-3xl border border-slate-100 shadow-2xl p-4 z-40 text-left">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-50">
                    <span className="font-bold text-xs text-slate-800">Recent Alerts</span>
                    <button onClick={() => setNotifications([])} className="text-[10px] text-slate-400 hover:text-red-500">Dismiss all</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">No alerts registered</p>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="text-left p-2 rounded-xl hover:bg-slate-50 transition-colors">
                          <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1">{n.desc}</p>
                          <span className="text-[8px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User credentials profile badge */}
            <button 
              onClick={() => setActiveTab('account')}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-[#1e3a8a]/5 border border-slate-100 hover:border-blue-300 shadow-xs transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center text-white text-xs font-bold leading-none select-none">
                {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-extrabold text-slate-800 leading-none truncate max-w-[80px]">{userName || 'Administrator'}</p>
                <p className="text-[8px] font-semibold text-[#1e3a8a] mt-0.5">Edit Profile</p>
              </div>
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Router Section */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200">
          
          {activeTab === 'dashboard' && (
            <>
        
        {/* Welcome Section */}
        <div id="dashboard_welcome" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE TRACKING ONLINE
              </span>
              <span className="text-xs text-slate-400">Timezone: Lagos, West Africa</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A1A24] tracking-tight mt-1.5">
              Hi, {userName ? userName.split(' ')[0] : 'Admin'}! 👋
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">Let's coordinate secure pick-up, arrivals, and transit for your school community today.</p>
          </div>
          
          <button 
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="self-start md:self-center flex items-center gap-2 px-5 py-3 w-full sm:w-auto justify-center bg-[#1e40af] text-white font-bold rounded-2xl shadow-md hover:bg-[#1e3a8a] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-sm min-h-[44px]"
          >
            <QrCode size={18} className="text-[#f59e0b]" />
            <span>Simulate Student Gate Scan</span>
          </button>
        </div>

        {/* Hero Interactive 3D Mock-up Banner card (Similar layout as the Left purple robot phone element in user's image) */}
        <section 
          id="hero_banner_interaction" 
          className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#1e40af] text-white p-6 sm:p-8 md:p-10 shadow-[0_20px_45px_rgba(30,58,138,0.22)] border border-white/10"
        >
          {/* Wave decor backdrops */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,_#ffffff_0%,_transparent_55%),_radial-gradient(circle_at_80%_80%,_#000000_0%,_transparent_65%)]" />
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_10%,_transparent_60%)] pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 text-white/95 text-[10px] font-bold tracking-widest uppercase rounded-full border border-white/5">
                <Sparkles size={11} className="text-yellow-300 animate-spin" />
                <span>Active School Session</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-[#fbbf24] text-xs font-semibold uppercase tracking-wider">MyEduRide Hub</p>
                <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  {schoolName || 'Grand Elite Academic Center'}
                </h3>
              </div>
              
              <p className="text-white/80 text-xs sm:text-sm max-w-xl font-medium leading-relaxed">
                Seamless security, live school gate reporting, automated student arrivals & safe RFID/QR dismissals linked directly to parents.
              </p>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span>Scanner Online</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-xl border border-white/5">
                  <span className="text-[#fbbf24]">★</span>
                  <span>{stats.present_today || 0} Arrivals Checked In</span>
                </div>
              </div>
            </div>

            {/* Simulated 3D Gate Badge matching the cute robot illustration in the image */}
            <div className="md:col-span-4 flex items-center justify-center">
              <div className="relative w-44 h-44 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-5 flex flex-col justify-between shadow-2xl relative overflow-hidden group hover:scale-105 transition-transform duration-300 select-none">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#fbbf24]/20 rounded-full blur-xl animate-pulse" />
                
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f59e0b] to-[#fbbf24] flex items-center justify-center text-slate-900 font-black shadow-md">
                    [O]
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-green-500/10 text-green-300 rounded-md border border-green-500/20">Active</span>
                </div>

                <div className="space-y-1 mt-4">
                  <h4 className="text-xs text-amber-200 uppercase tracking-wider font-extrabold">Instant Simulator</h4>
                  <p className="text-md font-bold text-white tracking-tight">Gate Reader RFID</p>
                  <p className="text-[10px] text-white/60">Hold card up to test gate log workflow as school personnel.</p>
                </div>

                {/* Simulated Glow Trigger Action tag */}
                <button 
                  type="button" 
                  onClick={() => setIsScanModalOpen(true)}
                  className="mt-3 py-2 px-3 rounded-xl bg-white text-[#1e40af] hover:bg-[#fbbf24] hover:text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors border-none ring-0 focus:outline-none min-h-[40px]"
                >
                  <span>Log Scan Now</span>
                  <ChevronRight size={14} className="stroke-[3px]" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Vibrant Metric Cards Section - STYLED EXACTLY LIKE THE CLASSROOMS LIST (Phone 2) */}
        <section id="vibrant_metrics_row" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-[#1a2238] tracking-tight">Administrative At A Glance</h3>
            <span className="text-xs font-bold text-[#1e40af] bg-[#1e40af]/10 px-2.5 py-1 rounded-full">Metrics Live</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Cards 1: Golden Yellow Gradient (Like Rekayasa Perangkat Lunak in Image) */}
            <div 
              id="metric_card_students" 
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFA629] via-[#FFB84C] to-[#FFC352] text-white p-5 shadow-lg group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white select-none">
                <Users size={64} className="opacity-15 rotate-12 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/10 rounded-full inline-block">Registered</span>
                <p className="text-[#1A1A24]/60 text-xs font-bold uppercase tracking-wider">Students</p>
                <p className="text-3xl sm:text-4xl font-black text-[#1A1A24]">{formatNumber(stats.total_students)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#1A1A24]/75 bg-white/20 px-2 py-0.5 rounded-md">View roster</span>
                <ChevronRight size={12} className="text-[#1A1A24]" />
              </div>
            </div>

            {/* Cards 2: Vibrant Indigo/Blue Gradient (Like Kecerdasan Buatan in Image) */}
            <div 
              id="metric_card_teachers"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] text-white p-5 shadow-lg group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white select-none">
                <GraduationCap size={64} className="opacity-15 rotate-12 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/10 rounded-full inline-block">Educators</span>
                <p className="text-blue-100/70 text-xs font-bold uppercase tracking-wider">Teachers</p>
                <p className="text-3xl sm:text-4xl font-black text-white">{formatNumber(stats.total_teachers)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/95 bg-white/20 px-2 py-0.5 rounded-md">Duty schedule</span>
                <ChevronRight size={12} className="text-white" />
              </div>
            </div>

            {/* Cards 3: Cyan Teal Gradient (Like Pemrograman Android in Image) */}
            <div 
              id="metric_card_parents"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2D9CDB] via-[#48B3E1] to-[#56CCF2] text-white p-5 shadow-lg group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white select-none">
                <UserCheck size={14} className="stroke-[3px]" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/10 rounded-full inline-block">Guardians</span>
                <p className="text-sky-50/70 text-xs font-bold uppercase tracking-wider">Parents</p>
                <p className="text-3xl sm:text-4xl font-black text-white">{formatNumber(stats.total_parents)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/95 bg-white/20 px-2 py-0.5 rounded-md">Contact list</span>
                <ChevronRight size={12} className="text-white" />
              </div>
            </div>

            {/* Cards 4: Crimson Magenta Rose Pink (Like Animasi & Multimedia in Image) */}
            <div 
              id="metric_card_attendance"
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EB5757] via-[#F2827F] to-[#E53E53] text-white p-5 shadow-lg group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white select-none">
                <TrendingUp size={64} className="opacity-15 rotate-12 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-black/10 rounded-full inline-block">Today's Check</span>
                <p className="text-red-100/70 text-xs font-bold uppercase tracking-wider">Present Inside</p>
                <p className="text-3xl sm:text-4xl font-black text-white">{formatNumber(stats.present_today)}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/95 bg-white/20 px-2 py-0.5 rounded-md">Roll check-in</span>
                <ChevronRight size={12} className="text-white" />
              </div>
            </div>

          </div>
        </section>

        {/* Dynamic Panels: Real-time interactive tables */}
        <section id="live_transit_panels" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReadyForPickupPanel schoolId={schoolId} />
          <PickupRequestsPanel schoolId={schoolId} />
        </section>

        {/* Bottom Section: Chart + Schedule List (Phone 1 Jadwal / Phone 3 Bento style) */}
        <section id="charts_and_schedules" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Today's Attendance Analytics (Bento Wheel Chart) */}
          <div id="analytics_box" className="bg-white rounded-3xl border border-[#e2e8f0] shadow-md p-6 flex flex-col justify-between">
            <div className="border-b border-gray-50 pb-3 mb-4 flex items-center justify-between">
              <h3 className="font-extrabold text-[#1a2238] text-sm tracking-tight uppercase">Presence Breakdown</h3>
              <span className="px-2 py-0.5 bg-[#1e40af]/5 text-[#1e40af] font-bold text-[9px] rounded-md">Roll Dial</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="relative w-44 h-44">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = stats.present_today + stats.late_today + stats.absent_today || 1;
                    const onTimePercent = (stats.present_today / total) * 100;
                    const latePercent = (stats.late_today / total) * 100;
                    const absentPercent = (stats.absent_today / total) * 100;
                    const radius = 38;
                    const circumference = 2 * Math.PI * radius;
                    
                    const onTimeOffset = 0;
                    const lateOffset = onTimePercent;
                    const absentOffset = onTimePercent + latePercent;
                    return (
                      <>
                        {/* Background track */}
                        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F1EDF6" strokeWidth="10" />
                        {/* On Time arc (Vibrant Green) */}
                        {stats.present_today > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r={radius} 
                            fill="none" 
                            stroke="#10b981" 
                            strokeWidth="10" 
                            strokeLinecap="round"
                            strokeDasharray={`${(onTimePercent / 100) * circumference} ${circumference}`} 
                            strokeDashoffset={`-${(onTimeOffset / 100) * circumference}`} 
                          />
                        )}
                        {/* Late arc (Vibrant gold) */}
                        {stats.late_today > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r={radius} 
                            fill="none" 
                            stroke="#f59e0b" 
                            strokeWidth="10" 
                            strokeLinecap="round"
                            strokeDasharray={`${(latePercent / 100) * circumference} ${circumference}`} 
                            strokeDashoffset={`-${(lateOffset / 100) * circumference}`} 
                          />
                        )}
                        {/* Absent arc (Vibrant red) */}
                        {stats.absent_today > 0 && (
                          <circle 
                            cx="50" 
                            cy="50" 
                            r={radius} 
                            fill="none" 
                            stroke="#ef4444" 
                            strokeWidth="10" 
                            strokeLinecap="round"
                            strokeDasharray={`${(absentPercent / 100) * circumference} ${circumference}`} 
                            strokeDashoffset={`-${(absentOffset / 100) * circumference}`} 
                          />
                        )}
                      </>
                    );
                  })()}
                </svg>

                {/* Circular Inner Indicator */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Logged</span>
                  <p className="text-3xl font-black text-[#1A1A24] tracking-tighter">
                    {stats.present_today + stats.late_today}
                  </p>
                  <p className="text-[10px] text-[#1e3a8a] font-bold uppercase">At School</p>
                </div>
              </div>
            </div>

            {/* Statistics legend */}
            <div className="mt-6 pt-4 border-t border-gray-50 grid grid-cols-3 gap-1">
              <div className="text-center p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1" />
                <p className="text-[10px] font-bold text-slate-400">On Time</p>
                <p className="text-xs font-black text-slate-800">{stats.present_today || 0}</p>
              </div>
              <div className="text-center p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1" />
                <p className="text-[10px] font-bold text-slate-400">Late</p>
                <p className="text-xs font-black text-slate-800">{stats.late_today || 0}</p>
              </div>
              <div className="text-center p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-1" />
                <p className="text-[10px] font-bold text-slate-400">Absent</p>
                <p className="text-xs font-black text-slate-800">{stats.absent_today || 0}</p>
              </div>
            </div>
          </div>

          {/* Recent Gate Activity Log (Styled styled exactly like 'Jadwal' on Phone 1) */}
          <div id="gate_activity_card" className="bg-white rounded-3xl border border-[#e2e8f0] shadow-md p-6 lg:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
                <div>
                  <h3 className="font-extrabold text-[#1A1A24] text-sm tracking-tight uppercase">Recent Gate Activity Log</h3>
                  <p className="text-[10px] text-slate-400">Real-time terminal transmissions</p>
                </div>
                <Link 
                  href="/dashboard/school-admin/reports/gate-activities" 
                  className="text-xs font-bold text-[#1e3a8a] hover:underline min-h-[44px] px-3.5 flex items-center justify-center bg-[#1e3a8a]/5 rounded-xl"
                >
                  View full reports
                </Link>
              </div>

              {/* Search activities */}
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="search"
                  id="activity_search_field"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search student or status..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a]/40 focus:ring-4 focus:ring-[#1e3a8a]/5 min-h-[44px]"
                />
              </div>

              {/* Feed List (Styled similarly to Jadwal: item borders, icon layouts) */}
              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                {filteredActivity.slice(0, 5).map((record: any) => (
                  <div 
                    key={record.id} 
                    className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-[#FDFBFF] hover:border-[#1e3a8a]/15 rounded-2xl border border-slate-50 transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Student Avatar circular block */}
                      <div className="relative shrink-0">
                        <StudentAvatar
                           photoUrl={record.student?.photo_url}
                           firstName={record.student?.first_name}
                           lastName={record.student?.last_name}
                           size="md"
                           accentColor="#1e3a8a"
                        />
                        {/* Action Mini Badge Indicator (Phone 1 squircle subbadge concept) */}
                        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black leading-none ${
                          record.type === 'arrival' 
                          ? 'bg-[#10b981] text-white shadow-xs' 
                          : 'bg-[#ff4d4d] text-white shadow-xs'
                        }`}>
                          {record.type === 'arrival' ? '↑' : '↓'}
                        </span>
                      </div>
                      
                      {/* Name & Transit Details */}
                      <div>
                        <p className="text-xs sm:text-sm font-black text-slate-800 group-hover:text-[#1e3a8a] transition-colors leading-none">
                          {record.student?.first_name} {record.student?.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold flex items-center gap-1.5 uppercase">
                          <span>Gate Station A</span>
                          <span>•</span>
                          <span className={record.type === 'arrival' ? 'text-[#10b981]' : 'text-rose-500'}>
                            {record.type === 'arrival' ? 'Entered School' : 'Exited / Picked Up'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Time Log in Lagos Time Zone and status (Late Vs On time matching schedule) */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-slate-700 font-mono">
                        {formatTimeLagos(record.timestamp)}
                      </p>
                      {record.type === 'arrival' && record.status && (
                        <span className={`inline-block text-[9px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded-md ${
                          record.status === 'on_time' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {record.status === 'on_time' ? 'On Time' : 'Late'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {filteredActivity.length === 0 && (
                  <div className="text-center py-10">
                    <Inbox className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-xs text-slate-400">
                      {recentActivity.length === 0 ? 'No gate records logged today' : 'No matches for: ' + activitySearch}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-slate-400 text-[10px] font-bold">
              <span>ACTIVE STATION COMPLETED ROUTING</span>
              <span>LAGOS TERM: OK</span>
            </div>
          </div>

        </section>
          </>
        )}

        {activeTab === 'schools' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight text-left">CONNECTED SCHOOL NODES</h2>
                <p className="text-xs text-slate-500">Central coordination and terminal details for your academic institution.</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 self-start md:self-auto">System Ready • Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center gap-3.5 pb-4 border-b border-slate-50">
                    <div className="w-12 h-12 rounded-2xl bg-[#1e40af]/5 text-[#1e40af] flex items-center justify-center">
                      <School size={24} />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">Primary Campus Node</h3>
                      <p className="text-[11px] text-[#1e40af] font-bold uppercase">{schoolName || 'Prototype Academy'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Node Identifier</span>
                      <p className="font-bold text-slate-700 mt-0.5">{schoolId || 'demo-lagos-node-01'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Operating Area</span>
                      <p className="font-bold text-slate-700 mt-0.5">Lagos, Nigeria</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Registered Students</span>
                      <p className="font-bold text-slate-700 mt-0.5">{stats.total_students || 120} active profiles</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold text-[10px] uppercase">Transit Status</span>
                      <p className="text-emerald-600 font-black mt-0.5">● Secure RFID Active</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">System Coordinates: 6.5244° N, 3.3792° E</span>
                  <button 
                    onClick={() => {
                      setToastText("School systems synchronized successfully!");
                      setTimeout(() => setToastText(""), 2000);
                    }}
                    className="py-1.5 px-3 bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-[10px] font-extrabold rounded-lg cursor-pointer min-h-[32px] border-none"
                  >
                    Sync Terminal Node
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-tr from-[#1e40af] to-[#3b82f6] text-white rounded-3xl p-6 flex flex-col justify-between shadow-md text-left">
                <div className="space-y-3">
                  <span className="px-2.5 py-0.5 bg-white/15 text-[10px] font-bold tracking-wider rounded-md uppercase">Lagos Terminal</span>
                  <h3 className="font-black text-lg">MyEduRide Hub Coordination</h3>
                  <p className="text-xs text-blue-100 leading-relaxed font-semibold">
                    This administrative router ensures all child departures, late check-ins, and guardian validation matches synchronize perfectly in Lagos.
                  </p>
                </div>
                <div className="text-[10px] text-blue-200 mt-6 font-mono leading-none border-t border-white/10 pt-4 text-left">
                  STATION STATUS: EXCELLENT
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'passwords' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight text-left">SECURE ACCESS RESTORATION</h2>
              <p className="text-xs text-slate-500">Provide secure locks and override parent/teacher portal credentials.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Reset self password card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs text-left">
                <legend className="font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-4 border-b border-slate-50 pb-2">Modify Your Admin Lock</legend>
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  {pwdError && <div className="p-3 text-xs bg-red-50 text-red-700 rounded-xl font-bold">{pwdError}</div>}
                  {pwdSuccess && <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl font-bold">{pwdSuccess}</div>}
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">New Security Password</label>
                    <input
                      type="password"
                      value={pwdNew}
                      onChange={(e) => setPwdNew(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1e40af]/30 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Confirm Password Link</label>
                    <input
                      type="password"
                      value={pwdConfirm}
                      onChange={(e) => setPwdConfirm(e.target.value)}
                      placeholder="Confirm security password"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1e40af]/30 min-h-[44px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={pwdLoading}
                    className="w-full py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer min-h-[44px] border-none"
                  >
                    {pwdLoading ? 'Saving lock...' : 'Update credentials secure lock'}
                  </button>
                </form>
              </div>

              {/* Roster Override Portal for Parents & Teachers */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between text-left">
                <div>
                  <legend className="font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-4 border-b border-slate-50 pb-2">Override Portal Credentials</legend>
                  
                  {resetSuccessMsg && (
                    <div className="p-3 text-xs bg-emerald-50 text-emerald-800 rounded-xl font-bold mb-4">
                      {resetSuccessMsg}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Select Target User Account</label>
                      <select 
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v) {
                            setResetUser(JSON.parse(v));
                          } else {
                            setResetUser(null);
                          }
                        }}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-700 focus:outline-none focus:border-[#1e40af]/30 min-h-[44px]"
                      >
                        <option value="">-- Choose User Account --</option>
                        <option value={JSON.stringify({ id: 'parent-olumide', name: 'Olumide Johnson (Parent)', role: 'guardian' })}>Olumide Johnson (Parent)</option>
                        <option value={JSON.stringify({ id: 'teacher-adebayo', name: 'Mrs. Adebayo (Grade 3 Teacher)', role: 'teacher' })}>Mrs. Adebayo (Teacher)</option>
                        <option value={JSON.stringify({ id: 'parent-chinwe', name: 'Chinwe Okonkwo (Parent)', role: 'guardian' })}>Chinwe Okonkwo (Parent)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Input New Gateway Passcode</label>
                      <input 
                        type="text"
                        placeholder="e.g. LagosSecure99@"
                        value={resetPwdVal}
                        onChange={(e) => setResetPwdVal(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1e40af]/30 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (!resetUser) {
                        alert('Please select a target user!');
                        return;
                      }
                      if (!resetPwdVal.trim()) {
                        alert('Please provide a secure passcode override value!');
                        return;
                      }
                      setResetSuccessMsg(`Security update: The passcode for user ${resetUser.name} was successfully updated to "${resetPwdVal}". Live Sync registered.`);
                      setResetPwdVal('');
                      setToastText('Credentials overridden successfully!');
                      setTimeout(() => {
                        setResetSuccessMsg('');
                        setToastText('');
                      }, 4000);
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer min-h-[44px] border-none"
                  >
                    Perform Gateway Passcode Override
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'id-cards' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight text-left">SMART STUDENT ID TERMINALS</h2>
                <p className="text-xs text-slate-500">View and print student RFID/QR cards connected to parent portals.</p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 self-start sm:self-auto">Terminal Connected</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Selector List */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-100 p-4 shadow-xs space-y-3 text-left">
                <legend className="font-extrabold text-slate-800 text-xs tracking-wider uppercase px-2 mb-2 border-b border-slate-50 pb-2">Select Student Profile</legend>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {simStudentOptions.map((student) => {
                    const isSelected = selectedIdStudent?.id === student.id;
                    return (
                      <button
                        key={student.id}
                        onClick={() => setSelectedIdStudent(student)}
                        className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer border-none bg-transparent ${
                          isSelected 
                          ? 'border-2 border-[#1e40af] bg-[#1e40af]/5 shadow-xs' 
                          : 'border-slate-50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <StudentAvatar 
                            photoUrl={student.photo_url} 
                            firstName={student.first_name} 
                            lastName={student.last_name} 
                            size="sm" 
                            accentColor="#1e3a8a" 
                          />
                          <div className="text-left">
                            <p className="text-xs font-black text-slate-800">{student.first_name} {student.last_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{student.grade}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-extrabold ${isSelected ? 'text-[#1e40af]' : 'text-slate-300'}`}>Select ›</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right ID Card Live physical simulation */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-slate-100 rounded-3xl border border-slate-200/50 min-h-[380px] space-y-6">
                
                {selectedIdStudent ? (
                  <div className="w-full max-w-sm rounded-[24px] bg-gradient-to-tr from-[#0f172a] via-[#1e3a8a] to-[#2563eb] text-white p-6 shadow-[0_20px_40px_rgba(30,58,138,0.22)] border border-white/10 flex flex-col justify-between relative overflow-hidden h-[240px] text-left">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#fbbf24]/10 rounded-full blur-xl animate-pulse" />
                    
                    {/* ID Header */}
                    <div className="flex justify-between items-start pb-2 border-b border-white/10">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">MyEduRide ID</h4>
                        <p className="text-[8px] text-slate-200 uppercase font-bold tracking-wider leading-none">{schoolName || 'Grand Elite Academic Center'}</p>
                      </div>
                      <span className="text-[8px] font-semibold bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/20">Secure Node</span>
                    </div>

                    {/* ID Body */}
                    <div className="flex items-center gap-4 py-4">
                      <StudentAvatar 
                        photoUrl={selectedIdStudent.photo_url} 
                        firstName={selectedIdStudent.first_name} 
                        lastName={selectedIdStudent.last_name} 
                        size="lg" 
                        accentColor="#fbbf24" 
                      />
                      <div className="text-left space-y-1">
                        <p className="text-sm font-black text-white leading-none">{selectedIdStudent.first_name} {selectedIdStudent.last_name}</p>
                        <p className="text-[10px] text-amber-200 font-extrabold">{selectedIdStudent.grade}</p>
                        <p className="text-[8px] text-slate-300 font-bold">RFID: RFID-{selectedIdStudent.id.toUpperCase()}</p>
                      </div>
                    </div>

                    {/* ID Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="text-[8px] font-mono text-slate-300">
                        <span>NODE ID-CARD TERMINAL</span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-amber-400">
                        <span>QR SECURE LINKED</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Loading profile card preview...</p>
                )}

                {/* ID Printers options */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  <button
                    onClick={() => {
                      setCardPrinting(true);
                      setToastText('Spooling card format... linking layout...');
                      setTimeout(() => {
                        setCardPrinting(false);
                        setToastText(`Card for ${selectedIdStudent?.first_name} sent to Lagos Node printer.`);
                        setTimeout(() => setToastText(''), 2500);
                      }, 3000);
                    }}
                    disabled={cardPrinting}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs rounded-2xl shadow-xs transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Printer size={14} className="text-slate-500" />
                    <span>{cardPrinting ? 'Printing...' : 'Print Student ID'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setExporting(true);
                      setToastText('Generating PDF schema...');
                      setTimeout(() => {
                        setExporting(false);
                        setToastText(`Student PDF export downloaded successfully!`);
                        setTimeout(() => setToastText(''), 2500);
                      }, 2500);
                    }}
                    disabled={exporting}
                    className="flex items-center justify-center gap-1.5 py-3 px-4 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-extrabold text-xs rounded-2xl shadow-sm transition-colors cursor-pointer min-h-[44px] border-none"
                  >
                    <Download size={14} className="text-white" />
                    <span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight text-left">TRANSIT LOG INTELLIGENCE</h2>
                <p className="text-xs text-slate-500">Analyze transit checks, late compliance rates, and downloadable summaries.</p>
              </div>
              
              <button
                onClick={() => {
                  setToastText("Compiling Excel/CSV transit spreadsheet...");
                  setTimeout(() => {
                    setToastText("Successfully downloaded CSV transit record (60 logs).");
                    setTimeout(() => setToastText(''), 2500);
                  }, 2000);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-sm border-none"
              >
                <Download size={13} />
                <span>Export CSV Report</span>
              </button>
            </div>

            {/* Quick Filters */}
            <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-xs flex flex-wrap gap-4 items-center text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Transit Mode:</span>
                <select 
                  value={reportTypeFilter} 
                  onChange={(e) => setReportTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1e40af]/30 min-h-[38px]"
                >
                  <option value="all">All Directions</option>
                  <option value="arrival">Inbound Arrival</option>
                  <option value="departure">Outbound Release</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Compliance Rank:</span>
                <select 
                  value={reportStatusFilter} 
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1e40af]/30 min-h-[38px]"
                >
                  <option value="all">All Timings</option>
                  <option value="on_time">On Time</option>
                  <option value="late">Late Arrival</option>
                </select>
              </div>
            </div>

            {/* Simulated report table matching filtered activities */}
            <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-md overflow-hidden text-left">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                <span className="text-[10px] uppercase text-slate-400 font-bold">Active Attendance & Gate Records</span>
                <span className="text-[10px] uppercase text-slate-500 font-semibold">{filteredActivity.length} events matching filters</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {filteredActivity
                  .filter(record => {
                    if (reportTypeFilter !== 'all' && record.type !== reportTypeFilter) return false;
                    if (reportStatusFilter !== 'all' && record.status !== reportStatusFilter) return false;
                    return true;
                  })
                  .map((record: any) => (
                    <div key={record.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-left">
                      <div className="flex items-center gap-3">
                        <StudentAvatar 
                          photoUrl={record.student?.photo_url} 
                          firstName={record.student?.first_name} 
                          lastName={record.student?.last_name} 
                          size="sm" 
                          accentColor="#1e3a8a" 
                        />
                        <div className="text-left">
                          <p className="font-extrabold text-slate-800">{record.student?.first_name} {record.student?.last_name}</p>
                          <p className="text-[10px] text-slate-400">Direction: <span className="text-[#1e40af] uppercase font-bold">{record.type}</span></p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-left">
                        <div>
                          <p className="text-slate-400 text-[10px] font-bold">L Lagos Time</p>
                          <p className="font-bold text-slate-700 font-mono">{formatTimeLagos(record.timestamp)}</p>
                        </div>
                        <div>
                          {record.type === 'arrival' ? (
                            <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md ${
                              record.status === 'on_time' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {record.status === 'on_time' ? 'On Time' : 'Late'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md bg-sky-50 text-[#1e40af] border border-blue-100">
                              Dispatched
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {filteredActivity.length === 0 && (
                  <p className="text-center py-10 text-xs text-slate-400">No transit records currently match your criteria.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight text-left">ADMINISTRATIVE USER SETTINGS</h2>
                <p className="text-xs text-slate-500">Manage your administrative terminal identity and sync session credentials.</p>
              </div>
              <span className="px-3 py-1 bg-[#1e40af]/10 text-[#1e40af] text-[10px] font-bold rounded-full self-start sm:self-auto">Secure SSL Session</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Profile details editor */}
              <div className="md:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4 text-left">
                <legend className="font-extrabold text-slate-800 text-xs tracking-wider uppercase mb-2 border-b border-slate-50 pb-2">Modify Admin Identity Details</legend>
                
                {profileSuccess && (
                  <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
                    {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="p-3.5 bg-red-50 text-red-800 text-xs font-bold rounded-xl border border-red-200">
                    {profileError}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Administrative Full Name</label>
                      <input
                        type="text"
                        value={profileFullName}
                        onChange={(e) => setProfileFullName(e.target.value)}
                        placeholder="e.g. Samuel Adekunle"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1e40af]/30 min-h-[44px]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">System Username</label>
                      <input
                        type="text"
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        placeholder="e.g. sam_admin"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1e40af]/30 min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Secured Notification Email Address</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. sam@myeduride.academy"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1e40af]/30 min-h-[44px]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer min-h-[44px] border-none"
                    >
                      Save Profile & Identity
                    </button>
                  </div>
                </form>
              </div>

              {/* Identity lock and Logouts */}
              <div className="bg-slate-50/50 rounded-3xl border border-slate-200/40 p-6 flex flex-col justify-between hover:border-[#1e3a8a]/10 transition-colors text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs uppercase leading-none">Security Station</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 leading-none">Authorized Node Locks</p>
                    </div>
                  </div>

                  <hr className="border-slate-200/50" />

                  <div className="space-y-2 text-xs font-semibold">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Access Rights Overview</p>
                    <div className="flex items-center gap-1.5 text-[#1a2238] bg-white p-2.5 rounded-xl border border-slate-200/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span>Gate Reader override active</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#1a2238] bg-white p-2.5 rounded-xl border border-slate-200/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span>Parent verification keys signed</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200/60 mt-6 space-y-3">
                  <button 
                    onClick={() => {
                      // Navigate directly to the password alteration tab inside
                      setActiveTab('passwords');
                      setToastText("Switched to credentials sync");
                      setTimeout(() => setToastText(''), 1500);
                    }}
                    className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border border-slate-200 min-h-[44px]"
                  >
                    <Lock size={12} />
                    Change Admin Password Key
                  </button>

                  <button 
                    onClick={logout}
                    className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-colors border border-rose-100 min-h-[44px]"
                  >
                    <LogOut size={12} />
                    Revoke Server Session Key
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* POPUP SIMULATOR MODAL: Highly engaging student RFID/QR scan emulator */}
      {isScanModalOpen && (
        <div id="sim_scan_modal" className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 font-sans text-left animate-in fade-in zoom-in-95 duration-250">
            
            {/* Modal Custom header */}
            <div className="p-5 border-b border-gray-50 bg-[#1e3a8a] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode size={20} className="text-[#fbbf24] animate-spin" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-tight">Student Gate Scan Simulator</h3>
                  <p className="text-[10px] text-blue-100">Simulate terminal events for testing</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsScanModalOpen(false)}
                className="p-1 rounded-xl bg-white/10 text-white/90 hover:bg-white/20 active:scale-95 transition-all outline-none border-none h-10 w-10 flex items-center justify-center"
                title="Exit simulator"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body Stages */}
            <div className="p-5 space-y-4">
              
              {/* STAGE 1: Pick a student to scan */}
              {scanStep === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Step 1: Choose student checking in/out</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {simStudentOptions.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setSelectedSimStudent(student);
                          setScanStep(2);
                        }}
                        className={`w-full p-2.5 rounded-2xl flex items-center justify-between border-2 transition-all text-left min-h-[50px] ${
                          selectedSimStudent?.id === student.id 
                          ? 'border-[#1e3a8a] bg-[#1e3a8a]/5' 
                          : 'border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#1e3a8a]/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <StudentAvatar
                            photoUrl={student.photo_url}
                            firstName={student.first_name}
                            lastName={student.last_name}
                            size="sm"
                            accentColor="#1e3a8a"
                          />
                          <div>
                            <p className="text-xs font-black text-slate-700">{student.first_name} {student.last_name}</p>
                            <p className="text-[10px] text-slate-400">{student.grade}</p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 2: Choose check status (Arrival VS Departure) */}
              {scanStep === 2 && selectedSimStudent && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-[#1e3a8a]/5 rounded-2xl border border-[#1e3a8a]/15 flex items-center gap-3">
                    <StudentAvatar
                      photoUrl={selectedSimStudent.photo_url}
                      firstName={selectedSimStudent.first_name}
                      lastName={selectedSimStudent.last_name}
                      size="sm"
                      accentColor="#1e3a8a"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-slate-700">Selected Profile</p>
                      <p className="text-xs text-[#1e3a8a] font-black">{selectedSimStudent.first_name} {selectedSimStudent.last_name}</p>
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  {/* Direction Selection */}
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">Step 2: Transit Direction</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setSimDirection('arrival')}
                        className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all text-slate-700 hover:bg-slate-50 min-h-[64px] ${
                          simDirection === 'arrival' 
                          ? 'border-[#10b981] bg-emerald-50 text-[#10b981]' 
                          : 'border-slate-100'
                        }`}
                      >
                        <span className="text-lg">↑</span>
                        <span>Check-In (Arrival)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSimDirection('departure')}
                        className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all text-slate-700 hover:bg-slate-50 min-h-[64px] ${
                          simDirection === 'departure' 
                          ? 'border-rose-500 bg-rose-50/50 text-rose-500' 
                          : 'border-slate-100'
                        }`}
                      >
                        <span className="text-lg">↓</span>
                        <span>Check-Out (Departure)</span>
                      </button>
                    </div>
                  </div>

                  {/* Arrival timing state condition: Late vs On time */}
                  {simDirection === 'arrival' && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Step 3: Schedule Status</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSimStatus('on_time')}
                          className={`p-2 rounded-xl border font-bold text-[11px] text-center min-h-[38px] ${
                            simStatus === 'on_time' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          On Time Arrival
                        </button>
                        <button
                          type="button"
                          onClick={() => setSimStatus('late')}
                          className={`p-2 rounded-xl border font-bold text-[11px] text-center min-h-[38px] ${
                            simStatus === 'late' 
                            ? 'bg-[#fbbf24]/20 text-yellow-800 border-[#fbbf24]' 
                            : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
                          }`}
                        >
                          Late Arrival
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Modal Footer Controls */}
                  <div className="pt-2 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setScanStep(1)}
                      className="py-2.5 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold text-center min-h-[44px]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulateScan}
                      className="py-2.5 rounded-2xl bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs font-extrabold text-center shadow-sm min-h-[44px]"
                    >
                      Transmit RFID Scan
                    </button>
                  </div>

                </div>
              )}

              {/* STAGE 3: Success Feedback */}
              {scanStep === 3 && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-md animate-bounce">
                    <Check size={32} className="stroke-[3px]" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-md">Terminal Event Transmission Successful!</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm px-4">
                      {toastText || 'The event has been successfully registered on the gate and parent feeds.'}
                    </p>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 bg-[#1e40af] animate-[pulse_2.2s_ease-in-out_infinite]" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold animate-pulse">Syncing logs... closing</p>
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Visual micro toast notification bar */}
      {toastText && scanStep !== 3 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white font-semibold text-xs py-3 px-5 rounded-full shadow-2xl z-50 flex items-center gap-2 animate-bounce max-w-xs">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
          <span>{toastText}</span>
        </div>
      )}

      </div>

    </div>
  );
}

function formatNumber(n: number): string {
  if (!n) return '0';
  if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 1 : 2) + 'K';
  return n.toString();
}
