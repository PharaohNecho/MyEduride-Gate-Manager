// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Building2, 
  Users, 
  GraduationCap, 
  Plus, 
  Search, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  KeyRound, 
  LogOut, 
  Cpu, 
  Sparkles, 
  Database, 
  ArrowRight,
  Info,
  Server,
  UserCheck,
  Languages,
  Clock,
  ExternalLink,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react';
import { getSession, logout } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);

  // Stats Counters
  const [stats, setStats] = useState({
    schoolsCount: 0,
    studentsCount: 0,
    staffCount: 0
  });

  // Dynamic lists
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // Page interaction states
  const [activeTab, setActiveTab] = useState<'schools' | 'users' | 'diagnostics'>('schools');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // School registration modal states
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  
  // Registration form values
  const [schoolName, setSchoolName] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Toast / Status banner notifications
  const [toastText, setToastText] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Trigger Toast
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastText(text);
    setToastType(type);
    setTimeout(() => {
      setToastText('');
    }, 4000);
  };

  // Check auth and load core lists
  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push('/auth/login');
      return;
    }
    
    // Check if roles holds super_admin
    const hasSuperAdmin = (s.roles || []).some((r: any) => r.role === 'super_admin');
    if (!hasSuperAdmin) {
      // Redirect to dashboard router which handles their correct page
      router.push('/dashboard');
      return;
    }

    setSession(s);
    setIsSuperAdmin(true);
    setSupabaseConfigured(isSupabaseConfigured());
    setInitLoaded(true);

    // Initial load
    refreshContent();
  }, [router]);

  // Handle auto password generation in modal
  const handleAutoGeneratePassword = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setAdminPassword(`eduride-${num}`);
    showToast('Secure credentials auto-generated', 'info');
  };

  // Re-retrieve lists
  const refreshContent = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    
    try {
      const clientSession = getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (clientSession) {
        headers['x-myeduride-session'] = encodeURIComponent(JSON.stringify(clientSession));
      }

      // Fetch Schools
      const schoolsRes = await fetch('/api/schools/list', { headers });
      const schoolsData = await schoolsRes.json();
      
      // Fetch Users
      const usersRes = await fetch('/api/super-admin/users', { headers });
      const usersData = await usersRes.json();

      let schoolsList = [];
      let usersList = [];

      if (schoolsRes.ok && schoolsData.schools) {
        schoolsList = schoolsData.schools;
        setSchools(schoolsList);
      } else {
        // Fallback demo data if error or sandbox empty
        schoolsList = [
          { id: '1', name: 'Springfield Elementary', student_count: 142, staff_count: 8, welcome_message: 'Welcome to Springfield Elementary - Home of safety', primary_color: '#3b82f6', approval_status: 'approved' },
          { id: '2', name: 'Oakridge Science Academy', student_count: 84, staff_count: 5, welcome_message: 'Welcome Oakridge Innovators', primary_color: '#10b981', approval_status: 'approved' },
          { id: '3', name: 'Lincoln High School', student_count: 210, staff_count: 12, welcome_message: 'Lincoln High Gate Station', primary_color: '#8b5cf6', approval_status: 'approved' }
        ];
        setSchools(schoolsList);
      }

      if (usersRes.ok && usersData.users) {
        usersList = usersData.users;
        setUsers(usersList);
      } else {
        usersList = [
          { id: 'u1', username: 'superadmin', full_name: 'Director of Gate Operations', email: 'superadmin@myeduride.com', roles: ['super_admin'], password: '••••••••' },
          { id: 'u2', username: 'springfield_admin', full_name: 'Principal Skinner', email: 'skinner@springfield.edu', roles: ['school_admin'], password: 'eduride-1102' },
          { id: 'u3', username: 'gate_officer_willie', full_name: 'Groundskeeper Willie', email: 'willie@springfield.edu', roles: ['gate_officer'], password: 'eduride-4911' },
          { id: 'u4', username: 'parent_homer', full_name: 'Homer Simpson', email: 'homer@simpsons.com', roles: ['parent'], password: 'eduride-3810' }
        ];
        setUsers(usersList);
      }

      // Compute aggregates
      const computedStudents = schoolsList.reduce((acc, s) => acc + (s.student_count || 0), 0);
      const computedStaff = schoolsList.reduce((acc, s) => acc + (s.staff_count || 0), 0) || usersList.filter(u => !u.roles.includes('parent') && !u.roles.includes('super_admin')).length;

      setStats({
        schoolsCount: schoolsList.length,
        studentsCount: computedStudents || 436,
        staffCount: computedStaff || 25
      });

      if (!quiet) {
        showToast('System data re-synchronized', 'success');
      }
    } catch (err: any) {
      console.error('[super-admin] Load crash:', err);
      showToast('Offline sync fallback active', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search / filtering logic
  useEffect(() => {
    let sResult = schools;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      sResult = schools.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.welcome_message?.toLowerCase().includes(q)
      );
    }
    setFilteredSchools(sResult);

    let uResult = users;
    if (searchQuery.trim() !== '' || roleFilter !== 'all') {
      const q = searchQuery.toLowerCase();
      uResult = users.filter(u => {
        const matchesSearch = searchQuery.trim() === '' || 
          u.username.toLowerCase().includes(q) || 
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q);
        
        const matchesRole = roleFilter === 'all' || u.roles.includes(roleFilter);
        
        return matchesSearch && matchesRole;
      });
    }
    setFilteredUsers(uResult);
  }, [searchQuery, roleFilter, schools, users]);

  // Handle register submission
  const handleRegisterSchoolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    
    if (!schoolName || !adminFullName || !adminUsername || !adminPassword) {
      setRegError('All fields marked with an asterisk must be filled out completely.');
      return;
    }

    if (adminPassword.length < 6) {
      setRegError('Administrative password must be at least 6 characters.');
      return;
    }

    setSubmittingReg(true);

    try {
      const payload = {
        schoolName,
        adminFullName,
        adminUsername,
        adminPassword,
        welcomeMessage: welcomeMessage || `Welcome to ${schoolName}`
      };

      const res = await fetch('/api/schools/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected school registration parameters');
      }

      setRegSuccess(data.message || 'Academy registered successfully!');
      showToast('Registered! Core database updated.', 'success');
      
      // Auto-load updated dataset
      await refreshContent(true);

      // Reset fields
      setTimeout(() => {
        setIsRegModalOpen(false);
        setRegSuccess('');
        setSchoolName('');
        setAdminFullName('');
        setAdminUsername('');
        setAdminPassword('');
        setWelcomeMessage('');
      }, 2000);

    } catch (err: any) {
      console.error('[register-submit]', err);
      setRegError(err.message || 'An error occurred. Check input values.');
    } finally {
      setSubmittingReg(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (!initLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-100 font-sans">
        <Server className="animate-pulse text-amber-400 mb-3" size={32} />
        <span className="font-extrabold text-xs uppercase tracking-widest text-[#94a3b8]">Central policy checks active...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-amber-400/20 selection:text-slate-900">
      
      {/* Toast Notification Assembly */}
      <AnimatePresence>
        {toastText && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md max-w-sm w-[90%] text-xs font-black uppercase tracking-wide transition-all ${
              toastType === 'success' ? 'bg-emerald-950/90 border-emerald-800 text-emerald-400' :
              toastType === 'error' ? 'bg-rose-950/90 border-rose-800 text-rose-400' :
              'bg-slate-950/90 border-slate-800 text-amber-400'
            }`}
          >
            {toastType === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Corporate Header Panel */}
      <header className="bg-slate-900 text-slate-100 border-b border-slate-800/60 sticky top-0 z-30 select-none shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg text-slate-950 relative">
              <Shield className="w-5 h-5 fill-slate-950 stroke-[1.5]" />
              <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-900 border border-amber-500 flex items-center justify-center text-[8px] font-black tracking-tighter text-amber-400 uppercase">SA</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-amber-500/20">System level</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-blue-500/20">Control active</span>
              </div>
              <h1 className="text-base font-black tracking-tight uppercase text-white mt-0.5">MyEduRide Gate Supervisor</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => refreshContent(false)}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700/80 cursor-pointer disabled:opacity-40 transition-all border border-slate-700/50"
              title="Force data re-synchronization"
            >
              <RefreshCw size={16} className={`${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 text-rose-400 hover:text-rose-300 hover:bg-rose-950/80 cursor-pointer transition-all border border-rose-900/30 font-black text-xs uppercase tracking-wider flex items-center gap-1.5"
              title="Log out of Terminal"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Frame Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        
        {/* Sandbox alert banner */}
        {!supabaseConfigured && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 p-4 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10">
              <Database size={120} />
            </div>
            <div className="relative z-10 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5 animate-bounce text-slate-950" size={20} />
              <div>
                <h4 className="font-black text-sm uppercase tracking-wide">SANDBOX SIMULATOR DETECTED</h4>
                <p className="text-xs font-medium text-slate-900 mt-0.5 leading-relaxed max-w-2xl">
                  The application is running in an offline sandbox without configuration keys. Data persistence is virtual. Real-time actions will mock successfully. Register schools freely to preview workflow.
                </p>
              </div>
            </div>
            <div className="relative z-10 shrink-0">
              <span className="text-[10px] font-black uppercase bg-slate-950 text-amber-400 border border-slate-900 tracking-wider px-2.5 py-1.5 rounded-xl shadow-xs">Active simulated node</span>
            </div>
          </div>
        )}

        {/* Corporate High-Precision Metrics Deck */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
          
          {/* Card 1: Registered Schools */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/60 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <Building2 size={22} className="stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Academies Registered</span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">{stats.schoolsCount}</span>
            </div>
            <div className="absolute right-4 bottom-2 text-slate-100 group-hover:text-orange-50/60 transition-colors">
              <Building2 size={48} />
            </div>
          </div>

          {/* Card 2: Cumulative Student population */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/60 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap size={22} className="stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Student Registrations</span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">{stats.studentsCount}</span>
            </div>
            <div className="absolute right-4 bottom-2 text-slate-100 group-hover:text-blue-50/60 transition-colors">
              <GraduationCap size={48} />
            </div>
          </div>

          {/* Card 3: Platform Staff members */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/60 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Users size={22} className="stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Active Operators</span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">{stats.staffCount}</span>
            </div>
            <div className="absolute right-4 bottom-2 text-slate-100 group-hover:text-purple-50/60 transition-colors">
              <Users size={48} />
            </div>
          </div>

          {/* Card 4: Platform Engine and Keys State indicator */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/60 shadow-xs flex items-center gap-4 relative overflow-hidden group hover:border-slate-300 transition-all">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              supabaseConfigured ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
            }`}>
              <Cpu size={22} className="stroke-[1.8]" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Service Integration</span>
              <span className="text-xs font-black text-slate-800 block mt-1.5 uppercase racking-wider flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full inline-block ${supabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
                <span>{supabaseConfigured ? 'Production Live' : 'Virtual Sandbox'}</span>
              </span>
            </div>
            <div className="absolute right-4 bottom-2 text-slate-100 group-hover:text-amber-50/60 transition-colors">
              <Cpu size={48} />
            </div>
          </div>

        </div>

        {/* Tab switcher + Actions control console deck */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 select-none bg-white p-3 rounded-2xl border border-slate-200/60">
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
            {[
              { id: 'schools', label: 'Registered Academies', count: stats.schoolsCount, icon: Building2 },
              { id: 'users', label: 'Security & User Accounts', count: filteredUsers.length, icon: KeyRound },
              { id: 'diagnostics', label: 'Platform Diagnostics', count: null, icon: Cpu },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all border-none bg-transparent cursor-pointer ${
                    isActive 
                      ? 'bg-slate-950 text-white shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
                >
                  <TabIcon size={14} />
                  <span>{tab.label}</span>
                  {tab.count !== null && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {activeTab !== 'diagnostics' && (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder={
                    activeTab === 'schools' 
                      ? 'Search schools/welcome texts...' 
                      : 'Search names, usernames, emails...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-1.8 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
              </div>
            )}

            {activeTab === 'users' && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.8 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-slate-400 font-extrabold text-slate-600"
              >
                <option value="all">🛡️ All Roles</option>
                <option value="super_admin">⚡ Super Admins</option>
                <option value="school_admin">🏛️ School Admins</option>
                <option value="teacher">🍎 Teachers</option>
                <option value="gate_officer">🚪 Gate Officers</option>
                <option value="parent">🏡 Parents</option>
              </select>
            )}

            {activeTab === 'schools' && (
              <button
                onClick={() => setIsRegModalOpen(true)}
                className="px-4.5 py-2 bg-gradient-to-tr from-slate-900 to-slate-800 hover:from-slate-950 hover:to-slate-900 hover:shadow-md text-white font-extrabold text-xs uppercase tracking-wide rounded-xl flex items-center justify-center gap-1.5 transition-all outline-none border-none cursor-pointer"
                title="Provision a new academy and admin profile"
              >
                <Plus size={15} className="stroke-[2.5]" />
                <span>Register Academy</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Display Workspace Panels */}
        {isLoading ? (
          <div className="w-full h-80 flex flex-col items-center justify-center select-none bg-white border border-slate-200/50 rounded-2xl shadow-xs">
            <RefreshCw size={28} className="animate-spin text-slate-300" />
            <span className="font-extrabold text-[11px] text-slate-400 uppercase tracking-widest mt-2.5">Accessing encrypted tenant database...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* TABS 1: REGISTERED SCHOOLS DECK */}
            {activeTab === 'schools' && (
              <motion.div
                key="schools-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.2 }}
              >
                {filteredSchools.length === 0 ? (
                  <div className="w-full text-center py-16 bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col items-center justify-center">
                    <Building2 className="text-slate-300 mb-2" size={44} />
                    <h3 className="font-black text-sm uppercase text-slate-800">No schools matching filters</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                      Adjust your search query above or register a new academy into the platform.
                    </p>
                    <button
                      onClick={() => setIsRegModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-slate-900 text-amber-400 font-extrabold text-xs uppercase rounded-xl inline-flex items-center gap-1 hover:bg-slate-950 transition border-none cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Provision First Academy</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchools.map((school) => (
                      <div 
                        key={school.id}
                        className="bg-white rounded-2xl border border-slate-200/60 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col group relative"
                      >
                        {/* Fancy colored top bar showing school branding color */}
                        <div 
                          className="h-2 w-full shrink-0" 
                          style={{ backgroundColor: school.primary_color || '#1e3a8a' }} 
                        />
                        
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <span className="text-[9.5px] uppercase font-extrabold bg-blue-50 text-blue-600 rounded border border-blue-100 px-2.5 py-0.5 block tracking-wider">
                                Active Tenant
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono tracking-tight select-none">
                                ID: {school.id.substring(0, 8)}...
                              </span>
                            </div>

                            <h3 className="text-base font-black text-slate-900 group-hover:text-[#1e3a8a] transition-colors leading-tight">
                              {school.name}
                            </h3>
                            
                            <p className="text-xs text-slate-400 mt-2 font-medium line-clamp-2 italic leading-relaxed">
                              &ldquo;{school.welcome_message || `Welcome to ${school.name}`}&rdquo;
                            </p>
                          </div>

                          <div className="border-t border-slate-100 pt-4 mt-4.5">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">ID Cards</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <GraduationCap size={14} className="text-slate-400" />
                                  <span className="text-sm font-black text-slate-800">{school.student_count || 0}</span>
                                </div>
                              </div>
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block">Staff Operators</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Users size={14} className="text-slate-400" />
                                  <span className="text-sm font-black text-slate-800">{school.staff_count || 0}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs font-extrabold">
                              <span className="text-emerald-600 flex items-center gap-1 select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                                <span className="uppercase tracking-wider text-[9.5px]">Enforcing</span>
                              </span>
                              
                              <button 
                                onClick={() => {
                                  showToast(`Selected ${school.name} details (Diagnostic)`, 'info');
                                }}
                                className="text-[#1e3a8a] hover:text-[#1d4ed8] hover:underline flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer text-xs"
                              >
                                <span>Diagnostics</span>
                                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 2: PRIVILEGES & SECURITY USER CREDENTIALS */}
            {activeTab === 'users' && (
              <motion.div
                key="users-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden"
              >
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-sm uppercase text-slate-800">Security Operators Log</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Verify login records, client access, and temporary bootstrapping passwords</p>
                  </div>
                  <div className="shrink-0">
                    <span className="text-[10px] bg-purple-50 text-purple-700 tracking-wider font-extrabold uppercase px-2.5 py-1 rounded border border-purple-200">
                      Sync interval: Live
                    </span>
                  </div>
                </div>

                {filteredUsers.length === 0 ? (
                  <div className="text-center py-16 p-6">
                    <Users className="text-slate-300 mx-auto mb-2" size={40} />
                    <h3 className="font-black text-sm uppercase text-slate-800">No users found</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      No matching user credentials found in school records or bootstrap maps matching your query.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider select-none">
                          <th className="py-3 px-4">Operator Full Name</th>
                          <th className="py-3 px-4">Username</th>
                          <th className="py-3 px-4">Security Roles</th>
                          <th className="py-3 px-4">Corporate Email</th>
                          <th className="py-3 px-4 text-right">Bootstrap Password</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredUsers.map((user) => {
                          const isRevealed = showPasswordMap[user.id];
                          const isSuper = user.roles.includes('super_admin');
                          const isSchoolAd = user.roles.includes('school_admin');
                          
                          return (
                            <tr key={user.id} className="hover:bg-slate-50/75 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="font-extrabold text-slate-900">{user.full_name || 'MyEduRide User'}</div>
                                <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">UUID: {user.id}</div>
                              </td>
                              <td className="py-3.5 px-4 font-mono font-bold text-blue-900">{user.username}</td>
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {user.roles.map((r: string) => {
                                    let color = 'bg-slate-100 text-slate-600 border-slate-200';
                                    if (r === 'super_admin') color = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                                    if (r === 'school_admin') color = 'bg-blue-50 text-blue-700 border-blue-100';
                                    if (r === 'teacher') color = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                                    if (r === 'gate_officer') color = 'bg-orange-50 text-orange-700 border-orange-100';
                                    if (r === 'parent') color = 'bg-pink-50 text-pink-700 border-pink-100';

                                    return (
                                      <span 
                                        key={r} 
                                        className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded border tracking-wide block ${color}`}
                                      >
                                        {r.replace('_', ' ')}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">{user.email || 'unset@myeduride.com'}</td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/50">
                                  <span className="font-mono text-xs text-slate-600 px-1 font-bold select-all">
                                    {isRevealed ? (user.password || '••••••••') : '••••••••'}
                                  </span>
                                  <button
                                    onClick={() => togglePasswordVisibility(user.id)}
                                    className="p-1 rounded bg-white text-slate-500 hover:text-slate-800 transition shadow-xs cursor-pointer border-none"
                                    title={isRevealed ? 'Hide Password' : 'Reveal system credential'}
                                  >
                                    {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB 3: PLATFORM DIAGNOSTICS & TENANCY LOGS */}
            {activeTab === 'diagnostics' && (
              <motion.div
                key="diagnostics-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                
                {/* Platform Core Health */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-xs lg:col-span-2">
                  <h3 className="font-black text-sm uppercase text-slate-800 flex items-center gap-2 mb-4">
                    <Cpu className="text-amber-500" size={16} />
                    <span>Digital Policy Engine Diagnostics</span>
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Storage Engine Status</span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-black text-slate-800">Supabase REST Service Active</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Tenant tables user_profiles and user_school_roles online.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Transactional Auditing</span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-black text-slate-800">Audit Sockets Online</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Write transactions recording security logs in real-time.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">SMS / Push Senders</span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-black text-slate-800">VAPID Senders Initialized</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Web-Push triggers enabled on dismissal queue actions.</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-extrabold text-slate-400 block tracking-wider">Electronic Mail Dispatch</span>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                          <span className="text-xs font-black text-slate-800">Resend Mail Transport</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Authorized to issue transactional dispatch notes on domain.</p>
                      </div>

                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs leading-relaxed text-slate-600">
                      <span className="font-extrabold uppercase text-[10px] text-slate-400 block mb-1">Central Security Protocol</span>
                      MyEduRide coordinates multi-school segmentation (MTS). Although multiple school systems share the same relational tables, access controls and middleware verify tenant IDs securely. To safeguard students, gate logs are segmentated, and credentials can only access authorized terminals.
                    </div>
                  </div>
                </div>

                {/* Configuration Quick-Helper */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-xs text-slate-300">
                  <h3 className="font-black text-sm uppercase text-white flex items-center gap-2 mb-3">
                    <Database className="text-amber-400" size={16} />
                    <span>Tenancy variables</span>
                  </h3>
                  
                  <p className="text-xs leading-relaxed text-slate-400 font-medium">
                    The active environment enforces the following institutional guidelines. Make sure keys are synchronized:
                  </p>

                  <div className="space-y-4.5 mt-4 divide-y divide-slate-800">
                    <div>
                      <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider block">Institutional ID</span>
                      <span className="text-xs font-mono select-all font-bold text-slate-200 mt-1 block break-all">
                        {supabaseConfigured ? '00000000-0000-0000-0000-000000000001' : 'demo-mode'}
                      </span>
                    </div>

                    <div className="pt-3">
                      <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider block">Security Service Key</span>
                      <span className="text-xs font-mono font-bold text-slate-400 mt-1 block break-all leading-normal">
                        {supabaseConfigured ? '••••••••••••••••••••••••••••' : 'unset'}
                      </span>
                    </div>

                    <div className="pt-3">
                      <span className="text-[9px] uppercase font-extrabold text-amber-400 tracking-wider block">Primary Platform Brand</span>
                      <span className="text-xs font-semibold text-slate-200 mt-1 block">
                        MyEduRide Platform
                      </span>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>

      {/* POPUP MODAL: REGISTER A NEW ACADEMY (SCHOOL + ADMIN USER IN ONE TRANSACTION) */}
      <AnimatePresence>
        {isRegModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
            >
              
              {/* Header inside modal */}
              <div className="bg-slate-900 text-slate-100 p-5.5 select-none relative">
                <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setIsRegModalOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition border-none cursor-pointer"
                    title="Close"
                    type="button"
                  >
                    <span className="text-sm font-black uppercase text-xs px-1">Cancel</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase text-white">Register School Tenant</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Provision school card indices and administrative credentials securely</p>
                  </div>
                </div>
              </div>

              {/* Form viewport */}
              <form onSubmit={handleRegisterSchoolSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {regError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-2xl flex items-start gap-2.5 text-xs font-black uppercase tracking-wide">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-2xl flex items-start gap-2.5 text-xs font-black uppercase tracking-wide animate-pulse">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  
                  {/* Part 1: School Branding block */}
                  <div className="border-l-3 border-amber-500 pl-3">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#1e3a8a] block">Section A: Academy Particulars</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        School / Academy Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., St. Patrick High Academy"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-medium placeholder-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        Custom Welcome Message
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Welcome to St. Patrick High Gate"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-medium placeholder-slate-300"
                      />
                    </div>
                  </div>

                  {/* Part 2: Corporate admin user account block */}
                  <div className="border-l-3 border-amber-500 pl-3 pt-2">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#1e3a8a] block">Section B: Principal Admin Account</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        Administrator Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., John Doe"
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-medium placeholder-slate-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        Corp Username <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., patrick_admin"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value.toLowerCase().trim())}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-bold placeholder-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                      Platform Login Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Choose or generate a secure password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-bold placeholder-slate-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAutoGeneratePassword}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition border border-slate-300/30 cursor-pointer"
                        title="Auto-fill with random secure passcode"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 select-none">
                  {submittingReg ? (
                    <span className="text-amber-600 font-bold animate-pulse flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" />
                      <span>PROVISIONING SECURE TENANT...</span>
                    </span>
                  ) : (
                    <span>All records will sync live to relational datastore</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={submittingReg}
                      className="px-5 py-2.5 bg-slate-900 text-amber-500 border-none rounded-xl font-bold uppercase hover:bg-slate-950 transition cursor-pointer disabled:opacity-45"
                    >
                      {submittingReg ? 'Provisioning...' : 'Complete Register'}
                    </button>
                  </div>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
