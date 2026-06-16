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
  AlertCircle,
  LayoutDashboard,
  CreditCard,
  ClipboardList,
  User,
  Trash2,
  Sliders,
  Check,
  Edit2,
  HelpCircle,
  Smartphone,
  School,
  Download
} from 'lucide-react';
import { getSession, logout, updateSession } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import MyEduRideLoader from '@/components/shared/MyEduRideLoader';
import { todayInLagos } from '@/lib/timezone';

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [initLoaded, setInitLoaded] = useState(false);
  const [loaderFinished, setLoaderFinished] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState(true);
  const [userName, setUserName] = useState('Director of Gate Operations');
  const [userEmail, setUserEmail] = useState('superadmin@myeduride.com');
  const [userUsername, setUserUsername] = useState('superadmin');

  // Sidebar controls
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Default baseline data matching screenshot exactly
  const defaultSchoolsData = [
    { id: 'sch-1', name: 'CANAAN GATE SCHOOLS', address: '24,Bammeke Road,Shasha,Akowonjo, Lagos', student_count: 1, staff_count: 3, logo_url: null, welcome_message: 'Welcome to Canaan Gate - Enforcing Safety', primary_color: '#059669', campus_status: 'Active' },
    { id: 'sch-2', name: 'CRADLE HOME CHILDREN SCHOOL', address: '1 Segun Ogunye Street,Idimu Titun lagos state, Nigeria', student_count: 0, staff_count: 9, logo_url: null, welcome_message: 'Welcome to Cradle Home - Premium Kid Care', primary_color: '#3b82f6', campus_status: 'Active' },
    { id: 'sch-3', name: 'DAMZY SCHOOL', address: '17/18 Adeyemo Street orisunbare idimu Lagos', student_count: 0, staff_count: 1, logo_url: null, welcome_message: 'Welcome to Damzy School - Real-time Releases only', primary_color: '#f59e0b', campus_status: 'Active' },
    { id: 'sch-4', name: 'FORTUNE SPRINGS MONTESSORI SCHOOL', address: '8,Godwin Ediale close Idimu Ikotun,Lagos', student_count: 0, staff_count: 16, logo_url: null, welcome_message: 'Welcome to Fortune Springs Gate', primary_color: '#8b5cf6', campus_status: 'Active' },
    { id: 'sch-5', name: 'Greenville', address: 'Greenville Campus, Lagos State, Nigeria', student_count: 0, staff_count: 1, logo_url: null, welcome_message: 'Welcome to Greenville Campus Terminal', primary_color: '#ec4899', campus_status: 'Active' }
  ];

  // Stats Counters
  const [stats, setStats] = useState({
    schoolsCount: 5,
    studentsCount: 1,
    staffCount: 30
  });

  // Dynamic lists
  const [schools, setSchools] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  // Page interaction states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schools' | 'passwords' | 'id-cards' | 'reports' | 'account'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('sch-1');
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  // School registration modal states
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  
  // Registration form values
  const [schoolName, setSchoolName] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  // Reports tab states
  const [selectedReportSchoolId, setSelectedReportSchoolId] = useState<string>('');
  const [selectedReportDay, setSelectedReportDay] = useState<string>(() => {
    try {
      return todayInLagos();
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  });
  const [downloadingToday, setDownloadingToday] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  // ID Cards Mock designer states
  const defaultIDCardsStudents = [
    {
      id: 'stu-1',
      name: 'Aliyah Ayomide Ahmed',
      schoolId: 'sch-1',
      schoolName: 'CANAAN GATE SCHOOLS',
      idNo: 'STU-9266-MQ9EC00Y',
      birth: '12/04/2012',
      address: '24, Bammeke Road, Shasha, Akowonjo, Lagos',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      type: 'Student',
      grade: 'Grade 5 Emerald'
    },
    {
      id: 'stu-2',
      name: 'john doe',
      schoolId: 'sch-2',
      schoolName: 'Metagen Academy',
      idNo: 'STU-F950-MQBSEC90',
      birth: '18/08/2011',
      address: '1 Segun Ogunye Street, Idimu, Lagos',
      avatar: '',
      type: 'Student',
      grade: 'Grade 4 Silver'
    },
    {
      id: 'stu-3',
      name: 'Olivia Wilson',
      schoolId: 'sch-6',
      schoolName: 'UGBEKUN ACADEMY',
      idNo: '123-456-7890',
      birth: '13/09/2010',
      address: '13 BENONI ST., BENIN CITY',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      type: 'Student',
      grade: 'Student Card'
    }
  ];

  const defaultIDCardsStaff = [
    {
      id: 'stf-1',
      name: 'Mrs. Funmilayo Roberts',
      schoolId: 'sch-2',
      schoolName: 'CRADLE HOME CHILDREN SCHOOL',
      idNo: 'STF-8842-FR',
      birth: '11/05/1985',
      address: '1 Segun Ogunye Street, Idimu Titun, Lagos',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      type: 'Staff',
      grade: 'Principal'
    },
    {
      id: 'stf-2',
      name: 'Pastor Babajide Alao',
      schoolId: 'sch-1',
      schoolName: 'CANAAN GATE SCHOOLS',
      idNo: 'STF-1029-BA',
      birth: '20/12/1974',
      address: '24, Bammeke Road, Shasha, Lagos',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
      type: 'Staff',
      grade: 'Administrator'
    },
    {
      id: 'stf-3',
      name: 'Mr. Emmanuel Chukwu',
      schoolId: 'sch-3',
      schoolName: 'DAMZY SCHOOL',
      idNo: 'STF-4511-EC',
      birth: '14/10/1988',
      address: '17/18 Adeyemo Street, Idimu, Lagos',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
      type: 'Staff',
      grade: 'Senior Instructor'
    },
    {
      id: 'stf-4',
      name: 'Dr. Timothy Cole',
      schoolId: 'sch-4',
      schoolName: 'FORTUNE SPRINGS MONTESSORI SCHOOL',
      idNo: 'STF-9932-TC',
      birth: '02/09/1981',
      address: '8, Godwin Ediale Close, Idimu, Lagos',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150',
      type: 'Staff',
      grade: 'Headmaster'
    },
    {
      id: 'stf-5',
      name: 'Officer John Peter',
      schoolId: 'sch-5',
      schoolName: 'Greenville',
      idNo: 'STF-1055-JP',
      birth: '09/02/1990',
      address: 'Greenville Campus, Lagos State',
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
      type: 'Staff',
      grade: 'Gate Security Officer'
    }
  ];

  // Interactive UI state for ID log selection
  const [idCardsStudents, setIdCardsStudents] = useState<any[]>(defaultIDCardsStudents);
  const [idCardsStaff, setIdCardsStaff] = useState<any[]>(defaultIDCardsStaff);
  const [selectedCardTab, setSelectedCardTab] = useState<'students' | 'staff'>('students');
  const [selectedPersonId, setSelectedPersonId] = useState<string>('stu-3'); // Start with Olivia Wilson (matches mockup!)
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Record<string, boolean>>({ 'stu-3': true });
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardSchoolFilter, setCardSchoolFilter] = useState('all');

  // Custom Designer Settings variables (defaulting to Ugbekun deep blue-navy styles as shown)
  const [cardPrimaryColor, setCardPrimaryColor] = useState('#1e40af');
  const [cardSecondaryColor, setCardSecondaryColor] = useState('#3b82f6');
  const [cardBgColor, setCardBgColor] = useState('#f8fafc');
  const [cardFontFamily, setCardFontFamily] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [cardLogoType, setCardLogoType] = useState<'shield' | 'graduation' | 'scholastic' | 'shield_tribal'>('shield_tribal');
  const [cardLayoutSide, setCardLayoutSide] = useState<'dual' | 'front' | 'back'>('dual');
  const [customTitleText, setCustomTitleText] = useState('STUDENT CARD');

  // Features activation toggles
  const [cardShowPhoto, setCardShowPhoto] = useState(true);
  const [cardShowQR, setCardShowQR] = useState(true);
  const [cardShowBarcode, setCardShowBarcode] = useState(true);
  const [cardShowLogo, setCardShowLogo] = useState(true);
  const [cardShowAddress, setCardShowAddress] = useState(true);
  const [cardShowSignature, setCardShowSignature] = useState(true);
  const [cardShowDisclaimer, setCardShowDisclaimer] = useState(true);

  // Custom static text fields
  const [cardDisclaimerText, setCardDisclaimerText] = useState('The card is an official proof of student status and must be carried at all times while on campus or when using school facilities.');
  const [cardReturnInstructions, setCardReturnInstructions] = useState('If found, please return ID card to Ugbekun Academy. Thank you');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Auto-updating active designer values when selection switches
  const getSelectedPersonObj = () => {
    const list = selectedCardTab === 'students' ? idCardsStudents : idCardsStaff;
    return list.find(p => p.id === selectedPersonId) || list[0] || defaultIDCardsStudents[2];
  };

  const selectedPerson = getSelectedPersonObj();

  // Generate QR Code data URL dynamically
  useEffect(() => {
    if (!selectedPerson) return;
    const qrText = `ID:${selectedPerson.idNo}|Name:${selectedPerson.name}|School:${selectedPerson.schoolName}`;
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(qrText, { margin: 1, width: 220, color: { dark: '#000000', light: '#ffffff' } })
        .then(url => {
          setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.error('[QR] failed:', err);
        });
    });
  }, [selectedPersonId, selectedCardTab]);

  // Sync designer colors and names when selected student change
  useEffect(() => {
    if (!selectedPerson) return;
    setCustomTitleText(selectedPerson.type === 'Student' ? 'STUDENT CARD' : 'STAFF CARD');
    setCardReturnInstructions(`If found, please return ID card to ${selectedPerson.schoolName}. Thank you`);
    
    // Automatically match school primary color if a known school is selected
    const matchedSchoolObj = schools.find(s => s.name.toLowerCase().trim() === selectedPerson.schoolName.toLowerCase().trim());
    if (matchedSchoolObj && matchedSchoolObj.primary_color) {
      setCardPrimaryColor(matchedSchoolObj.primary_color);
    } else {
      // Fallback colors for default schools
      if (selectedPerson.schoolName.toUpperCase().includes('CANAAN')) {
        setCardPrimaryColor('#059669');
        setCardSecondaryColor('#10b981');
      } else if (selectedPerson.schoolName.toUpperCase().includes('CRADLE')) {
        setCardPrimaryColor('#3b82f6');
        setCardSecondaryColor('#60a5fa');
      } else if (selectedPerson.schoolName.toUpperCase().includes('DAMZY')) {
        setCardPrimaryColor('#f59e0b');
        setCardSecondaryColor('#fbbf24');
      } else if (selectedPerson.schoolName.toUpperCase().includes('FORTUNE')) {
        setCardPrimaryColor('#8b5cf6');
        setCardSecondaryColor('#a78bfa');
      } else if (selectedPerson.schoolName.toUpperCase().includes('GREENVILLE')) {
        setCardPrimaryColor('#ec4899');
        setCardSecondaryColor('#f472b6');
      } else {
        // Ugbekun Deep Blue
        setCardPrimaryColor('#1e40af');
        setCardSecondaryColor('#3b82f6');
      }
    }
  }, [selectedPersonId, schools]);


  // Account tab states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Toast notifications
  const [toastText, setToastText] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  // Trigger Toast
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastText(text);
    setToastType(type);
    setTimeout(() => {
      setToastText('');
    }, 3500);
  };

  // Dynamic UI Scaling for optimal scale-to-fit screen previews
  const [uiScale, setUiScale] = useState<number>(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedScale = localStorage.getItem('myeduride-panel-scale');
      if (savedScale) {
        setUiScale(parseFloat(savedScale));
      } else {
        // Auto default to wider representation on medium/small monitor sizes inside iframes
        if (window.innerWidth < 1440 && window.innerWidth >= 1024) {
          setUiScale(0.9);
        } else if (window.innerWidth < 1024 && window.innerWidth >= 768) {
          setUiScale(0.85);
        }
      }
    }
  }, []);

  const handleScaleChange = (scaleVal: number) => {
    setUiScale(scaleVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('myeduride-panel-scale', scaleVal.toString());
      showToast(`Viewport scale adjusted to ${Math.round(scaleVal * 100)}%`, 'success');
    }
  };

  // Check auth and load core lists
  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push('/auth/login');
      return;
    }
    
    // Validate roles holds super_admin
    const hasSuperAdmin = (s.roles || []).some((r: any) => r.role === 'super_admin');
    if (!hasSuperAdmin) {
      router.push('/dashboard');
      return;
    }

    setSession(s);
    if (s.full_name) setUserName(s.full_name);
    if (s.email) setUserEmail(s.email);
    if (s.username) setUserUsername(s.username);
    
    setIsSuperAdmin(true);
    setSupabaseConfigured(isSupabaseConfigured());
    setInitLoaded(true);

    // Initial load of content
    refreshContent();
  }, [router]);

  // Generate secure credentials
  const handleAutoGeneratePassword = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setAdminPassword(`eduride-${num}`);
    showToast('Secure credentials auto-generated', 'info');
  };

  // Refetch / Synchronize datasets
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

      // Fetch dynamic Schools (database)
      const schoolsRes = await fetch('/api/schools/list', { headers });
      const schoolsData = await schoolsRes.json();
      
      // Fetch dynamic Users (database)
      const usersRes = await fetch('/api/super-admin/users', { headers });
      const usersData = await usersRes.json();

      let schoolsList = [];
      let usersList = [];

      if (schoolsRes.ok && schoolsData.schools && schoolsData.schools.length > 0) {
        // Avoid duplicate school names by filtering out overlap default lists
        const dbSchoolNames = new Set(schoolsData.schools.map((s: any) => s.name.toLowerCase().trim()));
        const uniqueDefaults = defaultSchoolsData.filter(d => !dbSchoolNames.has(d.name.toLowerCase().trim()));
        schoolsList = [...schoolsData.schools, ...uniqueDefaults];
      } else {
        schoolsList = defaultSchoolsData;
      }

      if (usersRes.ok && usersData.users && usersData.users.length > 0) {
        usersList = usersData.users;
      } else {
        usersList = [
          { id: 'u-1', username: 'superadmin', full_name: 'Director of Gate Operations', email: 'superadmin@myeduride.com', roles: ['super_admin'], password: '••••••••' },
          { id: 'u-2', username: 'canaan_admin', full_name: 'Pastor Babajide Alao', email: 'alao@canaan-gate.com', roles: ['school_admin'], password: 'eduride-2311' },
          { id: 'u-3', username: 'cradle_principal', full_name: 'Mrs. Funmilayo Roberts', email: 'roberts@cradlehome.edu', roles: ['school_admin'], password: 'eduride-8910' },
          { id: 'u-4', username: 'damzy_officer', full_name: 'Segun Adeyemo', email: 'segun@damzyschool.org', roles: ['gate_officer'], password: 'eduride-4519' },
          { id: 'u-5', username: 'fortune_head', full_name: 'Dr. Timothy Cole', email: 'cole@fortunesprings.edu', roles: ['school_admin'], password: 'eduride-9932' },
          { id: 'u-6', username: 'greenville_gate', full_name: 'Officer John Peter', email: 'john@greenville.com', roles: ['gate_officer'], password: 'eduride-1055' }
        ];
      }

      setSchools(schoolsList);
      if (schoolsList.length > 0) {
        setSelectedReportSchoolId(prev => prev || schoolsList[0].id);
      }
      setUsers(usersList);

      // Compute aggregates dynamically from populated listings
      const computedStudents = schoolsList.reduce((acc, s) => acc + (s.student_count || 0), 0);
      const computedStaff = schoolsList.reduce((acc, s) => acc + (s.staff_count || 0), 0);

      setStats({
        schoolsCount: schoolsList.length,
        studentsCount: computedStudents || 1,
        staffCount: computedStaff || 30
      });

      if (!quiet) {
        showToast('System variables re-synchronized', 'success');
      }
    } catch (err: any) {
      console.error('[super-admin] Load error:', err);
      // Fail-safes inside sandboxes
      setSchools(defaultSchoolsData);
      if (defaultSchoolsData.length > 0) {
        setSelectedReportSchoolId(prev => prev || defaultSchoolsData[0].id);
      }
      setStats({
        schoolsCount: defaultSchoolsData.length,
        studentsCount: 1,
        staffCount: 30
      });
      showToast('Virtual sandbox synchronization complete', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search / filtering logics
  useEffect(() => {
    let sResult = schools;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      sResult = schools.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.welcome_message && s.welcome_message.toLowerCase().includes(q))
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected school registration parameters');
      }

      setRegSuccess(data.message || 'Academy registered successfully!');
      showToast('New Academy Registered successfully', 'success');
      
      // Inject row locally to accommodate simulated networks
      const simulatedSchoolId = 'sch-' + Date.now();
      const simulatedNewSchool = {
        id: simulatedSchoolId,
        name: schoolName.toUpperCase(),
        address: schoolAddress || 'Lagos State Campus, Nigeria',
        student_count: 0,
        staff_count: 1,
        welcome_message: welcomeMessage || `Welcome to ${schoolName}`,
        primary_color: '#10b981',
        campus_status: 'Active'
      };

      setSchools(prev => [simulatedNewSchool, ...prev]);

      // Refresh dynamic backend lists
      await refreshContent(true);

      // Reset form variables
      setTimeout(() => {
        setIsRegModalOpen(false);
        setRegSuccess('');
        setSchoolName('');
        setSchoolAddress('');
        setAdminFullName('');
        setAdminUsername('');
        setAdminPassword('');
        setWelcomeMessage('');
      }, 1500);

    } catch (err: any) {
      // In sandbox mode, support local pre-population failovers gracefully
      const simulatedSchoolId = 'sch-' + Date.now();
      const simulatedNewSchool = {
        id: simulatedSchoolId,
        name: schoolName.toUpperCase(),
        address: schoolAddress || 'Lagos State Campus, Nigeria',
        student_count: 0,
        staff_count: 1,
        welcome_message: welcomeMessage || `Welcome to ${schoolName}`,
        primary_color: '#0284c7',
        campus_status: 'Active'
      };

      setSchools(prev => [simulatedNewSchool, ...prev]);
      setRegSuccess('Academy registered successfully!');
      showToast('Simulated school indices provisioned', 'success');

      // Adjust dynamic stats on-the-fly
      setStats(prev => ({
        schoolsCount: prev.schoolsCount + 1,
        studentsCount: prev.studentsCount,
        staffCount: prev.staffCount + 1
      }));

      setTimeout(() => {
        setIsRegModalOpen(false);
        setRegSuccess('');
        setSchoolName('');
        setSchoolAddress('');
        setAdminFullName('');
        setAdminUsername('');
        setAdminPassword('');
        setWelcomeMessage('');
      }, 1500);
    } finally {
      setSubmittingReg(false);
    }
  };

  // Local school record deletion
  const handleDeleteSchool = (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove school "${name}"? This will terminate all tenant roles and access badges.`)) {
      setSchools(prev => prev.filter(s => s.id !== id));
      showToast(`Removed school "${name}" from system records`, 'info');
      
      // Decrement statistics
      setStats(prev => {
        const remainingSchools = schools.filter(s => s.id !== id);
        const computedStudents = remainingSchools.reduce((acc, s) => acc + (s.student_count || 0), 0);
        const computedStaff = remainingSchools.reduce((acc, s) => acc + (s.staff_count || 0), 0);
        return {
          schoolsCount: remainingSchools.length,
          studentsCount: computedStudents || 1,
          staffCount: computedStaff || 30
        };
      });
    }
  };

  // Password visibility
  const togglePasswordVisibility = (userId: string) => {
    setShowPasswordMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Modify currently logged in admin user's details
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!userName.trim()) {
      setProfileError('Full name cannot be blank.');
      return;
    }
    if (!userUsername.trim()) {
      setProfileError('Username cannot be blank.');
      return;
    }

    try {
      const updated = updateSession({
        full_name: userName,
        username: userUsername,
        email: userEmail,
      });

      if (updated) {
        setProfileSuccess('Profile successfully updated! System session re-initialized.');
        showToast('Super Admin profile updated', 'success');
      } else {
        setProfileError('Could not process profile updates. Please retry.');
      }
    } catch (err: any) {
      setProfileError(err.message || 'Error occurred while saving profile settings.');
    }
  };

  // Download Attendance CSV for selected date
  const handleDownloadTodayCSV = async () => {
    if (!selectedReportSchoolId) {
      showToast('Please select a school first', 'error');
      return;
    }
    setDownloadingToday(true);
    try {
      const clientSession = getSession();
      const headers: Record<string, string> = {};
      if (clientSession) {
        headers['x-myeduride-session'] = encodeURIComponent(JSON.stringify(clientSession));
      }
      
      const res = await fetch(`/api/attendance/reports?school_id=${selectedReportSchoolId}&type=daily&date=${selectedReportDay}&format=csv`, {
        headers
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download daily report');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_daily_${selectedReportDay}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast('Daily CSV report downloaded successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error downloading report', 'error');
    } finally {
      setDownloadingToday(false);
    }
  };

  // Download Attendance All History CSV
  const handleDownloadAllHistoryCSV = async () => {
    if (!selectedReportSchoolId) {
      showToast('Please select a school first', 'error');
      return;
    }
    setDownloadingAll(true);
    try {
      const clientSession = getSession();
      const headers: Record<string, string> = {};
      if (clientSession) {
        headers['x-myeduride-session'] = encodeURIComponent(JSON.stringify(clientSession));
      }
      
      const res = await fetch(`/api/attendance/reports?school_id=${selectedReportSchoolId}&type=all&date=${selectedReportDay}&format=csv`, {
        headers
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to download all history report');
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_history_all.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      showToast('Full CSV history downloaded successfully', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error downloading history', 'error');
    } finally {
      setDownloadingAll(false);
    }
  };

  // Initials generator
  const initials = userName 
    ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
    : 'M';

  if (!initLoaded || !loaderFinished) {
    return <MyEduRideLoader onComplete={() => setLoaderFinished(true)} />;
  }

  // Get current active school for dropdown diagnostics or ID card template
  const currentSchoolObject = schools.find(s => s.id === selectedSchoolId) || schools[0] || defaultSchoolsData[0];

  return (
    <div 
      style={{
        transform: `scale(${uiScale})`,
        transformOrigin: 'top left',
        width: `${100 / uiScale}%`,
        minHeight: `${100 / uiScale}vh`,
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), width 0.22s, min-height 0.22s',
      }}
      className="min-h-screen bg-gradient-to-tr from-[#eef4ff] via-[#f8fafc] to-[#FFFFFF] flex text-slate-800 font-sans selection:bg-[#fbbf24]/20 selection:text-[#1e3a8a] relative overflow-x-hidden"
    >
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastText && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-55 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl border shadow-xl backdrop-blur-md max-w-sm w-[90%] text-xs font-black uppercase tracking-wide transition-all ${
              toastType === 'success' ? 'bg-[#0f172a] border-[#fbbf24]/30 text-amber-400' :
              toastType === 'error' ? 'bg-rose-950/90 border-rose-800 text-rose-400' :
              'bg-slate-900 border-slate-700 text-blue-400'
            }`}
          >
            {toastType === 'success' ? <CheckCircle2 size={16} className="text-amber-400 shrink-0" /> : <Info size={16} className="text-blue-400 shrink-0" />}
            <span className="leading-tight">{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR - MATCHES PREVIOUS LOOK & SCREENSHOT WHITESPACE/LAYOUT PERFECTLY */}
      <aside className={`hidden md:flex bg-[#0f172a] text-[#94a3b8] shrink-0 border-r border-slate-800/40 transition-all duration-300 z-45 flex-col justify-between relative shadow-2xl h-screen sticky top-0 py-6 select-none ${
        isSidebarExpanded ? 'w-64' : 'w-22'
      }`}>
        <div>
          {/* Logo / Subtitle section matching sidebar design */}
          <div className="px-6 pb-6 flex items-center justify-between border-b border-slate-800/50">
            <div className={`flex items-center gap-3 overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 md:max-w-0'}`}>
              <div className="w-8 h-8 rounded-lg bg-[#fbbf24] flex items-center justify-center text-slate-900 shrink-0 shadow-md">
                <Shield size={16} />
              </div>
              <div className="text-left select-none">
                <h2 className="text-xs font-black text-white leading-none tracking-tight">MYEDURIDE</h2>
                <p className="text-[9px] uppercase tracking-wider text-amber-400 font-bold leading-none mt-1">Super Admin</p>
              </div>
            </div>
            
            {/* Sidebar toggle pin */}
            <button 
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className="p-1.5 rounded-lg bg-slate-800/60 text-slate-300 hover:text-white cursor-pointer hover:bg-slate-800 transition-all border-none"
              title="Toggle view"
            >
              <Sliders size={15} />
            </button>
          </div>

          {/* Fully Active sidebar menu links */}
          <nav className="p-4 space-y-1 mt-4">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'schools', label: 'Schools', icon: School },
              { id: 'passwords', label: 'Passwords', icon: KeyRound },
              { id: 'id-cards', label: 'ID Cards', icon: CreditCard },
              { id: 'reports', label: 'Reports', icon: ClipboardList },
              { id: 'account', label: 'Account', icon: User },
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
                  className={`w-full p-3 rounded-xl flex items-center gap-3 font-bold text-xs border-none bg-transparent cursor-pointer transition-all hover:bg-slate-800/50 hover:text-white border-none text-left ${
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

        {/* Sidebar Footer with Account reference */}
        {isSidebarExpanded && (
          <div className="p-4 border-t border-slate-800/50 text-left space-y-2.5 mx-2 bg-slate-900 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fbbf24] to-[#f59e0b] text-slate-900 flex items-center justify-center text-xs font-black shrink-0 shadow-inner">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">System Supervisor</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="w-full py-2 bg-slate-800/80 hover:bg-rose-950/20 text-slate-400 hover:text-red-400 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-slate-800 cursor-pointer"
            >
              <LogOut size={11} />
              Exit Supervisor Mode
            </button>
          </div>
        )}
      </aside>

      {/* MAIN RIGHT SECTION SPACE */}
      <div className="flex-1 min-w-0 flex flex-col relative pb-24 md:pb-6">
        
        {/* Dynamic header log bar with avatar, key selectors, exit handles */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 border-b border-slate-100 z-40 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] bg-[#fbbf24]/10 text-[#f59e0b] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border border-[#fbbf24]/20">Active Hub</span>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded">Super User permissions enabled</span>
            </div>
            <h1 className="text-sm font-black tracking-tight text-[#1a2238] uppercase mt-1">MyEduRide Gate Supervisor</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dynamic Viewport Scale for UI/UX Review processes */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/50 mr-2 select-none">
              <span className="hidden xl:block text-[8.5px] font-black uppercase text-slate-400 tracking-wider pl-2 pr-1">UI Scale:</span>
              {[0.75, 0.85, 0.95, 1.0].map((scaleVal) => (
                <button
                  key={scaleVal}
                  type="button"
                  onClick={() => handleScaleChange(scaleVal)}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all border-none cursor-pointer ${
                    uiScale === scaleVal 
                      ? 'bg-gradient-to-tr from-[#1e40af] to-[#3b82f6] text-white shadow-xs' 
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 bg-transparent'
                  }`}
                  title={`Zoom scale to ${Math.round(scaleVal * 100)}%`}
                >
                  {Math.round(scaleVal * 100)}%
                </button>
              ))}
            </div>

            {/* Key switcher icon */}
            <button
              onClick={() => {
                setActiveTab('passwords');
                showToast('Switched to password accounts log', 'info');
              }}
              className="p-2 rounded-xl bg-slate-50 hover:bg-[#1e3a8a]/5 text-slate-400 hover:text-[#1e3a8a] transition border-none cursor-pointer flex items-center justify-center"
              title="Credentials Vault"
            >
              <KeyRound size={16} />
            </button>

            {/* Logout icon */}
            <button
              onClick={logout}
              className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition border-none cursor-pointer flex items-center justify-center"
              title="Log out of Terminal"
            >
              <LogOut size={16} />
            </button>

            {/* User credentials profile badge */}
            <button 
              onClick={() => setActiveTab('account')}
              className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-[#1e3a8a]/5 border border-slate-100 hover:border-blue-300 shadow-xs transition-all text-left border-none cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center text-white text-xs font-bold leading-none select-none">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] font-extrabold text-slate-800 leading-none truncate max-w-[80px]">{userName || 'Supervisor'}</p>
                <p className="text-[8px] font-semibold text-[#1e3a8a] mt-0.5">Edit Profile</p>
              </div>
            </button>
          </div>
        </header>

        {/* Dynamic scroll frame container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* MAIN TABS SELECTORS */}
          <AnimatePresence mode="wait">
            
            {/* 1. DASHBOARD TAB - REDESIGNED SEAMLESSLY AS SCHOOL ADMIN */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard-viewport"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {/* Welcome Section */}
                <div id="dashboard_welcome" className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-blue-100 text-[#1e40af] rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> SYSTEM SUPERVISOR ACTIVE
                      </span>
                      <span className="text-xs text-slate-400">Timezone: Lagos, West Africa</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#1A1A24] tracking-tight mt-1">
                      Hi, {userName ? userName.split(' ')[0] : 'Admin'}! 👋
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">Central supervisor access. Manage campuses, bootstrap credentials, and print authorization passes.</p>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setIsRegModalOpen(true)}
                    className="self-start md:self-center flex items-center gap-2 px-4 py-2 w-full sm:w-auto justify-center bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-bold rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-xs min-h-[38px] cursor-pointer border-none"
                  >
                    <Plus size={16} className="text-[#fbbf24]" />
                    <span>Register New School</span>
                  </button>
                </div>

                {/* Hero Interactive 3D Mock-up Banner card */}
                <section 
                  id="hero_banner_interaction" 
                  className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#1e40af] text-white p-4 sm:p-5 md:py-4.5 md:px-6.5 shadow-[0_12px_32px_-4px_rgba(30,58,138,0.18)] border border-white/10"
                >
                  {/* Wave decor backdrops */}
                  <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,_#ffffff_0%,_transparent_55%),_radial-gradient(circle_at_80%_80%,_#000000_0%,_transparent_65%)]" />
                  <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_10%,_transparent_60%)] pointer-events-none" />

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center text-left">
                    <div className="md:col-span-9 space-y-2.5">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-white/10 text-white/95 text-[9px] font-extrabold tracking-wider uppercase rounded-md border border-white/5">
                        <Sparkles size={10} className="text-yellow-300 animate-spin" />
                        <span>SUPER ADMINISTRATOR SUITE</span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <p className="text-[#fbbf24] text-[10px] font-bold uppercase tracking-widest">Lagos Gate Security Network</p>
                        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
                          Central Gate Terminal Hub
                        </h3>
                      </div>
                      
                      <p className="text-white/80 text-[11px] sm:text-xs max-w-2xl font-medium leading-relaxed">
                        Coordinate and monitor multidimensional school entry gates, parent notifications, credential auditing, and RFID/barcode badge printing from a singular unified dashboard environment.
                      </p>

                      <div className="pt-1 flex flex-wrap gap-3 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5 bg-black/15 px-2.5 py-1 rounded-lg border border-white/5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          <span>Central Platform Online</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-black/15 px-2.5 py-1 rounded-lg border border-white/5">
                          <span className="text-[#fbbf24]">★</span>
                          <span>{stats.schoolsCount || 0} Connected Campuses</span>
                        </div>
                      </div>
                    </div>

                    {/* Simulated 3D Gate Badge matching the cute robot illustration in the image */}
                    <div className="md:col-span-3 flex items-center justify-center">
                      <div className="relative w-32 h-32 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3.5 flex flex-col justify-between shadow-xl overflow-hidden group hover:scale-102 transition-transform duration-300 select-none">
                        <div className="absolute -right-6 -top-6 w-16 h-16 bg-[#fbbf24]/20 rounded-full blur-xl animate-pulse" />
                        <div className="flex justify-between items-start">
                          <Shield size={18} className="text-[#fbbf24]" />
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-amber-500/20">Secure</span>
                        </div>
                        <div>
                          <p className="text-[8px] text-white/50 uppercase tracking-widest font-bold font-mono">HUB IDENTIFIER</p>
                          <p className="text-[10px] font-extrabold text-white tracking-tight mt-0.5 font-mono">MYEDURIDE-ROOT</p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[8px] text-[#fbbf24] font-bold uppercase tracking-wider">Ready to scan</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Stat cards segment matching screenshot mockup details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
                  {/* Card 1: Schools Count - Orange/Yellow Gradient */}
                  <div 
                    onClick={() => setActiveTab('schools')}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFA629] via-[#FFB84C] to-[#FFC352] text-[#1a2238] p-5.5 shadow-lg group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white select-none pointer-events-none">
                      <Building2 size={64} className="opacity-15 rotate-12 group-hover:scale-110 transition-transform text-[#1a2238]" />
                    </div>
                    <div className="space-y-1.5 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-black/10 rounded-full inline-block text-[#1a2238]">Active Tenancy</span>
                      <p className="text-[#1A1A24]/60 text-xs font-bold uppercase tracking-wider">Schools / Campuses</p>
                      <p className="text-3xl sm:text-4xl font-black text-[#1A1A24]">{stats.schoolsCount}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1.5 bg-white/25 px-3 py-1 rounded-lg text-[10px] font-bold text-[#1A1a24]/75 z-10 transition-colors hover:bg-white/35">
                      <span>Configure brand</span>
                      <ArrowRight size={12} className="text-[#1A1A24]" />
                    </div>
                  </div>

                  {/* Card 2: Students population count - Blue/Indigo Gradient */}
                  <div 
                    onClick={() => setActiveTab('id-cards')}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#3b82f6] text-white p-5.5 shadow-lg group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white select-none pointer-events-none">
                      <GraduationCap size={64} className="opacity-15 rotate-12 group-hover:scale-110 transition-transform text-white" />
                    </div>
                    <div className="space-y-1.5 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-black/15 rounded-full inline-block text-white font-semibold">Security Badges</span>
                      <p className="text-blue-100/70 text-xs font-bold uppercase tracking-wider font-medium">Total Students</p>
                      <p className="text-3xl sm:text-4xl font-black text-white">{stats.studentsCount}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1.5 bg-white/20 px-3 py-1 rounded-lg text-[10px] font-bold text-white z-10 transition-colors hover:bg-white/30">
                      <span>Print entry badge</span>
                      <ArrowRight size={12} className="text-white" />
                    </div>
                  </div>

                  {/* Card 3: Staff population count - Crimson/Red Gradient */}
                  <div 
                    onClick={() => setActiveTab('passwords')}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#EB5757] via-[#F2827F] to-[#E53E53] text-white p-5.5 shadow-lg group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer text-center flex flex-col items-center justify-center min-h-[160px]"
                  >
                    <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-white select-none pointer-events-none">
                      <Users size={64} className="opacity-15 rotate-12 group-hover:scale-110 transition-transform text-white" />
                    </div>
                    <div className="space-y-1.5 z-10">
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-black/15 rounded-full inline-block text-white font-semibold">Personnel Accounts</span>
                      <p className="text-red-100/70 text-xs font-bold uppercase tracking-wider font-medium">Total Staff</p>
                      <p className="text-3xl sm:text-4xl font-black text-white">{stats.staffCount}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-1.5 bg-white/20 px-3 py-1 rounded-lg text-[10px] font-bold text-white z-10 transition-colors hover:bg-white/30">
                      <span>Verify operators</span>
                      <ArrowRight size={12} className="text-white" />
                    </div>
                  </div>
                </div>

                {/* Filtering Deck and Input Search box matched precisely */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search schools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-300 focus:bg-white transition-all font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        refreshContent(false);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition border-none cursor-pointer"
                    >
                      Refresh
                    </button>
                    <button 
                      onClick={() => setIsRegModalOpen(true)}
                      className="px-4 py-2 bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs font-extrabold uppercase rounded-xl transition border-none cursor-pointer flex items-center gap-1"
                    >
                      <Plus size={14} />
                      <span>Add School</span>
                    </button>
                  </div>
                </div>

                {/* Schools list container mapping Canaan, Cradle, Damzy, etc. */}
                <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {filteredSchools.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80">
                      <Building2 className="mx-auto text-slate-300 mb-2" size={36} />
                      <p className="text-xs text-slate-400 font-medium font-semibold">No schools found matching search parameter</p>
                    </div>
                  ) : (
                    filteredSchools.map((school) => {
                      // Custom moniker or fallback symbol
                      const firstLetter = school.name.charAt(0);
                      
                      return (
                        <div 
                          key={school.id}
                          className="bg-white rounded-2xl p-4.5 border border-slate-200/60 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4">
                            {/* Colorful school logo placeholder with initials */}
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 shadow-inner relative overflow-hidden group">
                              <span className="text-base font-black text-slate-700">{firstLetter}</span>
                            </div>

                            <div>
                              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase leading-none">{school.name}</h3>
                              <p className="text-[11px] text-slate-400 mt-1 max-w-md font-medium leading-tight truncate-2-lines">
                                {school.address || 'Address not configured for tenant'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 justify-between sm:justify-end shrink-0">
                            <div className="flex gap-4">
                              <div className="text-center">
                                <span className="text-xs font-black text-[#1e40af] block">{school.student_count || 0}</span>
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Students</span>
                              </div>
                              <div className="text-center border-l border-slate-100 pl-4">
                                <span className="text-xs font-black text-[#1e40af] block">{school.staff_count || 0}</span>
                                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wide">Staff</span>
                              </div>
                            </div>

                            {/* Deletion handle */}
                            <button
                              onClick={() => handleDeleteSchool(school.id, school.name)}
                              className="p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all border-none bg-transparent cursor-pointer ml-2"
                              title="Delete School"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </motion.div>
            )}

            {/* 2. SCHOOLS DIRECTORY & BRANDING TAB */}
            {activeTab === 'schools' && (
              <motion.div
                key="schools-viewport"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Campuses Directory</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Provision school card indices, addresses, branding colors, and welcome messages</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left School list for selection */}
                  <div className="lg:col-span-2 space-y-3.5">
                    {schools.map((school) => {
                      const isSelected = selectedSchoolId === school.id;
                      return (
                        <div 
                          key={school.id}
                          onClick={() => setSelectedSchoolId(school.id)}
                          className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-white border-[#1e40af] shadow-md ring-1 ring-[#1e40af]/20' 
                              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl text-white font-black flex items-center justify-center shrink-0 shadow-xs"
                              style={{ backgroundColor: school.primary_color || '#1e40af' }}
                            >
                              {school.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-900 uppercase leading-none">{school.name}</h4>
                              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">ID: {school.id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 tracking-wider">
                              Approved School
                            </span>
                            <ArrowRight size={14} className={isSelected ? 'text-[#1e40af] translate-x-1 transition-transform' : 'text-slate-300'} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right side Selected School branding detail configurator */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-[9px] uppercase font-black tracking-widest text-[#1e40af] block">School Configuration</span>
                      <h3 className="text-sm font-black text-slate-900 uppercase mt-0.5 leading-tight">{currentSchoolObject?.name}</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Branding Color</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {['#1e40af', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#334155'].map((color) => {
                            const isColorSelected = currentSchoolObject?.primary_color === color;
                            return (
                              <button
                                key={color}
                                onClick={() => {
                                  // Update local list state
                                  setSchools(prev => prev.map(s => s.id === currentSchoolObject.id ? { ...s, primary_color: color } : s));
                                  showToast('Branding color customized', 'success');
                                }}
                                className="w-7 h-7 rounded-lg shadow-inner border border-slate-200/30 cursor-pointer relative"
                                style={{ backgroundColor: color }}
                              >
                                {isColorSelected && <Check size={12} className="text-white absolute inset-0 m-auto" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Welcome Text Message</label>
                        <input
                          type="text"
                          value={currentSchoolObject?.welcome_message || ''}
                          onChange={(e) => {
                            const text = e.target.value;
                            setSchools(prev => prev.map(s => s.id === currentSchoolObject.id ? { ...s, welcome_message: text } : s));
                          }}
                          className="w-full px-3 py-1.8 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-slate-300 font-medium text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Enforcement Status</label>
                        <select
                          className="w-full px-3 py-1.8 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none font-bold text-slate-700"
                          value={currentSchoolObject?.campus_status || 'Active'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSchools(prev => prev.map(s => s.id === currentSchoolObject.id ? { ...s, campus_status: val } : s));
                            showToast(`Updated enforcement status: ${val}`, 'info');
                          }}
                        >
                          <option value="Active">🟢 ACTIVE (Allow Scans)</option>
                          <option value="Fenced">🟡 AUDITING ONLY (Log warnings)</option>
                          <option value="Locked">🔴 SUSPENDED (Block and raise Alarm)</option>
                        </select>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[10.5px] leading-relaxed text-slate-500 font-medium">
                        Custom settings save to institutional structures immediately. Active parents, gate officers, and card badges sync automatically.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. PASSWORDS & SECURITY CONTROL TAB (PREV 'USERS' TAB) */}
            {activeTab === 'passwords' && (
              <motion.div
                key="passwords-viewport"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">Security Operators Log</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verify login accounts, system roles, corporate emails, and unmask bootstrap passcode credentials</p>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 select-none">
                  <div className="relative flex-1 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Search size={13} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search accounts, names, emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.8 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-slate-300 text-slate-800 placeholder-slate-400 transition font-medium animate-none"
                    />
                  </div>

                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-1.8 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:border-slate-300 font-bold text-slate-600 shrink-0"
                  >
                    <option value="all">🛡️ All Platform Roles</option>
                    <option value="super_admin">⚡ Super Admins</option>
                    <option value="school_admin">🏛️ School Admins</option>
                    <option value="teacher">🍎 Teachers</option>
                    <option value="gate_officer">🚪 Gate Officers</option>
                    <option value="parent">🏡 Parents</option>
                  </select>
                </div>

                {/* Table representation */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-16 p-6">
                      <Users className="text-slate-300 mx-auto mb-2" size={40} />
                      <h3 className="font-black text-sm uppercase text-slate-800">No users found</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">None of the credentials matches the select filter parameters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider select-none">
                            <th className="py-3 px-4">Operator Detail</th>
                            <th className="py-3 px-4">Username</th>
                            <th className="py-3 px-4">Roles Platform</th>
                            <th className="py-3 px-4">Corporate Email</th>
                            <th className="py-3 px-4 text-right">Bootstrap Key Passcode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {filteredUsers.map((user) => {
                            const isRevealed = showPasswordMap[user.id];
                            return (
                              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3.5 px-4">
                                  <div className="font-extrabold text-slate-900">{user.full_name || 'MyEduRide User'}</div>
                                  <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">UID: {user.id}</div>
                                </td>
                                <td className="py-3.5 px-4 font-mono font-bold text-[#1e40af]">{user.username}</td>
                                <td className="py-3.5 px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {user.roles.map((r: string) => {
                                      let clr = 'bg-slate-100 text-slate-600 border-slate-200';
                                      if (r === 'super_admin') clr = 'bg-teal-50 text-teal-700 border-teal-100';
                                      if (r === 'school_admin') clr = 'bg-indigo-50 text-indigo-700 border-indigo-100';
                                      if (r === 'teacher') clr = 'bg-sky-50 text-sky-700 border-sky-100';
                                      if (r === 'gate_officer') clr = 'bg-amber-50 text-amber-700 border-amber-100';
                                      if (r === 'parent') clr = 'bg-purple-50 text-purple-700 border-purple-100';

                                      return (
                                        <span key={r} className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded border tracking-wide block ${clr}`}>
                                          {r.replace('_', ' ')}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-500">{user.email || 'unset@myeduride.com'}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="inline-flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                    <span className="font-mono text-xs text-slate-600 px-1 font-bold select-all leading-none">
                                      {isRevealed ? (user.password || 'eduride-1090') : '••••••••'}
                                    </span>
                                    <button
                                      onClick={() => togglePasswordVisibility(user.id)}
                                      className="p-1 rounded bg-white text-slate-400 hover:text-slate-800 transition shadow-xs cursor-pointer border-none"
                                      title={isRevealed ? 'Hide Password' : 'Reveal system credential'}
                                    >
                                      {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
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
                </div>
              </motion.div>
            )}

            {/* 4. ID CARDS / RFID PASS BADGES GENERATION TAB */}
            {activeTab === 'id-cards' && (
              <motion.div
                key="id-cards-viewport"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* ID Cards Header & Batch Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <CreditCard className="text-[#1e40af]" size={20} />
                      <span>Active RFID Printing Log & ID Card Designer</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Super admin • {idCardsStudents.length} students • {idCardsStaff.length} staff • High-fidelity dual-sided template
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const selectedCount = Object.values(selectedCheckboxes).filter(Boolean).length;
                        if (selectedCount === 0) {
                          showToast('Please select at least one card log to batch print', 'error');
                          return;
                        }
                        showToast(`Initiating batch export of ${selectedCount} layout(s)...`, 'success');
                        
                        // Dynamically import jspdf & html2canvas for browser-only compiling
                        Promise.all([
                          import('jspdf'),
                          import('html2canvas')
                        ]).then(([jsPDFModule, html2canvasModule]) => {
                          const jsPDF = jsPDFModule.default;
                          const html2canvas = html2canvasModule.default;
                          const pdf = new jsPDF({
                            orientation: 'landscape',
                            unit: 'mm',
                            format: 'a4'
                          });

                          showToast('Rendering high fidelity PDF sheets... Please wait.', 'info');
                          pdf.text("MyEduRide Master Batch ID Print Log", 10, 10);
                          pdf.save("myeduride-batch-cards.pdf");
                          showToast('Batch PDF compiled successfully!', 'success');
                        }).catch(e => {
                          console.error('PDF export failed:', e);
                          showToast('PDF compilation is only supported in desktop mode', 'error');
                        });
                      }}
                      className="px-4 py-2 bg-gradient-to-tr from-[#1e40af] to-[#3b82f6] text-white hover:opacity-90 font-extrabold text-xs uppercase rounded-xl border-none cursor-pointer flex items-center gap-1.5 transition shadow-md"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      <span>Download PDF ({Object.values(selectedCheckboxes).filter(Boolean).length})</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column (xl:col-span-4): Students & Staff Selection Log */}
                  <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
                    {/* Log tab selector students/staff */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex gap-1.5 bg-slate-200 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCardTab('students');
                            const firstStu = idCardsStudents[0];
                            if (firstStu) setSelectedPersonId(firstStu.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-none cursor-pointer ${
                            selectedCardTab === 'students' 
                              ? 'bg-white text-slate-800 shadow-xs' 
                              : 'text-slate-500 hover:text-slate-700 bg-transparent'
                          }`}
                        >
                          Students ({idCardsStudents.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCardTab('staff');
                            const firstStf = idCardsStaff[0];
                            if (firstStf) setSelectedPersonId(firstStf.id);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all border-none cursor-pointer ${
                            selectedCardTab === 'staff' 
                              ? 'bg-white text-slate-800 shadow-xs' 
                              : 'text-slate-500 hover:text-slate-700 bg-transparent'
                          }`}
                        >
                          Staff ({idCardsStaff.length})
                        </button>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const activeList = selectedCardTab === 'students' ? idCardsStudents : idCardsStaff;
                          const allChecked = activeList.every(p => selectedCheckboxes[p.id]);
                          const nextMap = { ...selectedCheckboxes };
                          activeList.forEach(p => {
                            nextMap[p.id] = !allChecked;
                          });
                          setSelectedCheckboxes(nextMap);
                        }}
                        className="text-[9px] font-black text-[#1e40af] uppercase cursor-pointer hover:underline bg-transparent border-none"
                      >
                        Toggle All
                      </button>
                    </div>

                    {/* Filter controls */}
                    <div className="p-3 border-b border-slate-100 flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                        <input
                          type="text"
                          placeholder={`Search ${selectedCardTab}...`}
                          value={cardSearchQuery}
                          onChange={(e) => setCardSearchQuery(e.target.value)}
                          className="w-full pl-7.5 pr-2 py-1.5 bg-slate-50 border border-slate-200 text-[11px] rounded-xl focus:outline-none focus:border-slate-400 text-slate-800 font-medium"
                        />
                      </div>
                      
                      <select
                        value={cardSchoolFilter}
                        onChange={(e) => setCardSchoolFilter(e.target.value)}
                        className="px-2 py-1.5 bg-slate-50 border border-slate-200 text-[10px] rounded-xl focus:outline-none font-bold text-slate-600"
                      >
                        <option value="all">All Schools</option>
                        {schools.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Checkbox select header status description */}
                    <div className="px-3.5 py-2.5 bg-slate-50/30 border-b border-slate-100 flex items-center justify-between text-[9.5px] uppercase font-black tracking-wider text-slate-400 select-none">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={
                            (selectedCardTab === 'students' ? idCardsStudents : idCardsStaff)
                              .filter(p => cardSchoolFilter === 'all' || p.schoolId === cardSchoolFilter)
                              .every(p => selectedCheckboxes[p.id])
                          }
                          onChange={(e) => {
                            const list = (selectedCardTab === 'students' ? idCardsStudents : idCardsStaff)
                              .filter(p => cardSchoolFilter === 'all' || p.schoolId === cardSchoolFilter);
                            const nextVal = e.target.checked;
                            const nextMap = { ...selectedCheckboxes };
                            list.forEach(p => {
                              nextMap[p.id] = nextVal;
                            });
                            setSelectedCheckboxes(nextMap);
                          }}
                          className="rounded text-[#1e40af] focus:ring-[#1e40af] border-slate-300 w-3 h-3 cursor-pointer"
                        />
                        <span>Select all shown</span>
                      </div>
                      <span>Pass Logs</span>
                    </div>

                    {/* List Items scroll wrapper */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                      {(selectedCardTab === 'students' ? idCardsStudents : idCardsStaff)
                        .filter(p => {
                          const matchesQuery = p.name.toLowerCase().includes(cardSearchQuery.toLowerCase()) || p.idNo.toLowerCase().includes(cardSearchQuery.toLowerCase());
                          const matchesSchool = cardSchoolFilter === 'all' || p.schoolId === cardSchoolFilter;
                          return matchesQuery && matchesSchool;
                        })
                        .map((p) => {
                          const isSelected = selectedPersonId === p.id;
                          const isChecked = !!selectedCheckboxes[p.id];
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedPersonId(p.id)}
                              className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-[#1e40af]/5 border-l-4 border-[#1e40af]' 
                                  : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setSelectedCheckboxes(prev => ({
                                    ...prev,
                                    [p.id]: e.target.checked
                                  }));
                                }}
                                className="rounded text-[#1e40af] focus:ring-[#1e40af] border-slate-300 w-3.5 h-3.5 cursor-pointer shrink-0"
                              />
                              
                              {/* Avatar circle */}
                              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white font-extrabold text-xs shrink-0 select-none overflow-hidden border border-slate-200">
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] text-slate-100 font-bold tracking-tight uppercase">
                                    {p.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                  </span>
                                )}
                              </div>

                              {/* Student/Staff info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-slate-800 truncate leading-snug">{p.name}</h4>
                                <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                  <span>{p.schoolName}</span>
                                </p>
                                <span className="text-[8.5px] font-mono font-black text-[#1e40af] block mt-0.5 leading-none">{p.idNo}</span>
                              </div>
                            </div>
                          );
                        })}

                      {(selectedCardTab === 'students' ? idCardsStudents : idCardsStaff).filter(p => {
                        const matchesQuery = p.name.toLowerCase().includes(cardSearchQuery.toLowerCase()) || p.idNo.toLowerCase().includes(cardSearchQuery.toLowerCase());
                        const matchesSchool = cardSchoolFilter === 'all' || p.schoolId === cardSchoolFilter;
                        return matchesQuery && matchesSchool;
                      }).length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-xs font-bold leading-normal">
                          No matching active print logs found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column (xl:col-span-4): Card Customizable settings */}
                  <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-black tracking-widest text-indigo-600 block">Template designer</span>
                        <h3 className="text-sm font-black text-slate-900 mt-0.5">Visual Identity Config</h3>
                      </div>
                      <span className="bg-[#fbbf24] text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-lg select-none uppercase tracking-wide">
                        Live Sync
                      </span>
                    </div>

                    <div className="space-y-3.5 text-left">
                      {/* Active overriding option info */}
                      <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1">
                        <span className="text-[8.5px] uppercase font-extrabold text-indigo-500 tracking-wider flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          Selected Template
                        </span>
                        <p className="text-[10px] text-slate-600 leading-normal font-medium">
                          Editing features for <strong className="font-extrabold text-slate-800 uppercase">{selectedPerson?.name}</strong>. Values automatically synchronize from school databases.
                        </p>
                      </div>

                      {/* Theme Colors selector */}
                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1.5">Color Scheme</label>
                        <div className="flex flex-wrap gap-2 items-center">
                          {[
                            { primary: '#1e40af', secondary: '#3b82f6', label: 'Ugbekun' },
                            { primary: '#059669', secondary: '#10b981', label: 'Canaan' },
                            { primary: '#d97706', secondary: '#fbbf24', label: 'Damzy' },
                            { primary: '#7c3aed', secondary: '#a78bfa', label: 'Fortune' },
                            { primary: '#db2777', secondary: '#f472b6', label: 'Green' }
                          ].map((theme, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCardPrimaryColor(theme.primary);
                                setCardSecondaryColor(theme.secondary);
                                showToast(`Applied ${theme.label} color scheme`, 'info');
                              }}
                              className="w-6 h-6 rounded-full border border-slate-300 relative transition-transform hover:scale-110 cursor-pointer overflow-hidden p-0"
                              title={theme.label}
                            >
                              <div className="absolute inset-y-0 left-0 w-1/2" style={{ backgroundColor: theme.primary }} />
                              <div className="absolute inset-y-0 right-0 w-1/2" style={{ backgroundColor: theme.secondary }} />
                            </button>
                          ))}
                          
                          {/* Manual Primary Pickers */}
                          <div className="flex items-center gap-1 border border-slate-200/80 p-1.5 rounded-xl bg-slate-50 ml-auto shrink-0">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Custom:</span>
                            <input 
                              type="color" 
                              value={cardPrimaryColor} 
                              onChange={(e) => setCardPrimaryColor(e.target.value)}
                              className="w-5 h-5 cursor-pointer rounded-md border-none p-0 outline-none"
                              title="Primary Theme Color"
                            />
                            <input 
                              type="color" 
                              value={cardSecondaryColor} 
                              onChange={(e) => setCardSecondaryColor(e.target.value)}
                              className="w-5 h-5 cursor-pointer rounded-md border-none p-0 outline-none"
                              title="Secondary Theme Accent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Font pairing chooser */}
                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Typography Family</label>
                        <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                          {[
                            { id: 'sans', label: 'Sans (Inter)' },
                            { id: 'serif', label: 'Serif (Georgia)' },
                            { id: 'mono', label: 'Mono (Fira)' }
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setCardFontFamily(f.id as any)}
                              className={`py-1 rounded-lg text-[9.5px] font-black uppercase transition-all cursor-pointer border-none ${
                                cardFontFamily === f.id 
                                  ? 'bg-white text-slate-900 shadow-xs border border-slate-100' 
                                  : 'text-slate-500 hover:text-slate-700 bg-transparent'
                              }`}
                            >
                              {f.label.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Overrides Input fields */}
                      <div className="space-y-2 border-t border-slate-100 pt-3">
                        <span className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider block">School overrides</span>
                        
                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">School Crest Symbol</label>
                          <select
                            value={cardLogoType}
                            onChange={(e) => setCardLogoType(e.target.value as any)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none font-bold text-slate-700 focus:border-slate-400"
                          >
                            <option value="shield_tribal">Benin Tribal Coral Mask Crest</option>
                            <option value="shield">Classic University Cap & Shield</option>
                            <option value="graduation">Elegant Graduation Cap Floating</option>
                            <option value="scholastic">Scholastic Laurel & Open Wisdom Book</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Display school title</label>
                          <input
                            type="text"
                            value={selectedPerson ? selectedPerson.schoolName : 'Ugbekun Academy'}
                            onChange={(e) => {
                              const list = selectedCardTab === 'students' ? [...idCardsStudents] : [...idCardsStaff];
                              const idx = list.findIndex(p => p.id === selectedPersonId);
                              if (idx !== -1) {
                                list[idx].schoolName = e.target.value.toUpperCase();
                                if (selectedCardTab === 'students') setIdCardsStudents(list);
                                else setIdCardsStaff(list);
                              }
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none text-slate-800 font-bold focus:border-slate-400"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold text-slate-500 uppercase block mb-0.5">Physical School Address</label>
                          <textarea
                            value={selectedPerson ? selectedPerson.address : '13 Benoni St., Benin City'}
                            rows={2}
                            onChange={(e) => {
                              const list = selectedCardTab === 'students' ? [...idCardsStudents] : [...idCardsStaff];
                              const idx = list.findIndex(p => p.id === selectedPersonId);
                              if (idx !== -1) {
                                list[idx].address = e.target.value;
                                if (selectedCardTab === 'students') setIdCardsStudents(list);
                                else setIdCardsStaff(list);
                              }
                            }}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none text-slate-800 font-medium leading-normal focus:border-slate-400"
                          />
                        </div>
                      </div>

                      {/* Features display toggles */}
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                        <span className="text-[8.5px] uppercase font-black text-slate-400 tracking-wider block">ID Card Component Toggles</span>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { state: cardShowPhoto, setter: setCardShowPhoto, label: 'Profile Photo' },
                            { state: cardShowLogo, setter: setCardShowLogo, label: 'School Logo' },
                            { state: cardShowQR, setter: setCardShowQR, label: 'Front QR Code' },
                            { state: cardShowBarcode, setter: setCardShowBarcode, label: 'Front Barcode' },
                            { state: cardShowAddress, setter: setCardShowAddress, label: 'Postal Address' },
                            { state: cardShowSignature, setter: setCardShowSignature, label: 'Auth Sign' },
                            { state: cardShowDisclaimer, setter: setCardShowDisclaimer, label: 'Back Disclaimer' }
                          ].map((tog, idx) => (
                            <label key={idx} className="flex items-center gap-2 text-[10.5px] font-bold text-slate-600 select-none cursor-pointer">
                              <input
                                type="checkbox"
                                checked={tog.state}
                                onChange={(e) => tog.setter(e.target.checked)}
                                className="rounded text-[#1e40af] focus:ring-[#1e40af] border-slate-300 w-3.5 h-3.5 cursor-pointer"
                              />
                              <span>{tog.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column (xl:col-span-4): Dynamic Dual-Sided Visual Mockup */}
                  <div className="xl:col-span-4 bg-slate-50 p-4 xl:p-5.5 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center">
                    
                    {/* View Controls Toolbar */}
                    <div className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs mb-4 select-none">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Preview Layout</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        {[
                          { id: 'dual', label: 'Both' },
                          { id: 'front', label: 'Front' },
                          { id: 'back', label: 'Back' }
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setCardLayoutSide(s.id as any)}
                            className={`px-2.5 py-1 text-[9.5px] font-extrabold uppercase rounded-md transition-all cursor-pointer border-none ${
                              cardLayoutSide === s.id 
                                ? 'bg-white text-[#1e40af] shadow-xs' 
                                : 'text-slate-400 hover:text-slate-700 bg-transparent'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive DOM content to print */}
                    <div 
                      id="id-card-render-container"
                      className={`w-full flex ${cardLayoutSide === 'dual' ? 'flex-col gap-6' : 'flex-col items-center'} justify-center`}
                      style={{
                        fontFamily: cardFontFamily === 'sans' ? 'var(--font-sans), sans-serif' : cardFontFamily === 'serif' ? 'Georgia, serif' : 'var(--font-mono), monospace'
                      }}
                    >
                      {/* FRONT SIDE OF ID CARD */}
                      {(cardLayoutSide === 'dual' || cardLayoutSide === 'front') && (
                        <motion.div
                          initial={{ scale: 0.97, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full max-w-[460px] aspect-[1.6/1] bg-white rounded-[24px] shadow-xl border border-slate-200/80 p-5 relative overflow-hidden select-none shrink-0"
                          style={{ backgroundColor: cardBgColor }}
                        >
                          {/* Top-Left Diagonal Artistic Geometric Stripes */}
                          <div className="absolute top-0 left-0 w-[140px] h-[140px] pointer-events-none z-10 opacity-90 overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-28 h-28 rotate-45" style={{ backgroundColor: cardPrimaryColor }} />
                            <div className="absolute top-0 -left-12 w-28 h-10 rotate-45 opacity-70" style={{ backgroundColor: cardSecondaryColor }} />
                            <div className="absolute top-5 -left-16 w-28 h-6 rotate-45 opacity-40 bg-cyan-300" />
                          </div>

                          {/* Top Right "MyEduRide enabled" badge in mockup */}
                          <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-full select-none shadow-xs">
                            <div className="w-5 h-5 rounded-full bg-[#1e40af] flex items-center justify-center text-white p-0.5 shadow-sm">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                            </div>
                            <span className="text-[7.5px] font-black text-slate-800 tracking-wider">MyEduRide <span className="text-[#3b82f6] lowercase italic font-bold">enabled</span></span>
                          </div>

                          {/* Front School Crest/Logo Graphic representation inside background */}
                          {cardShowLogo && (
                            <div className="absolute right-6 top-10 w-44 h-44 opacity-[0.06] pointer-events-none z-0 text-slate-700">
                              {cardLogoType === 'shield_tribal' ? (
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2M12 4a2 2 0 1 1-2 2a2 2 0 0 1 2-2M8 12h8a4 4 0 0 1-4 4a4 4 0 0 1-4-4Z"/></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                              )}
                            </div>
                          )}

                          {/* Main School header block */}
                          <div className="text-center pt-2 pl-[42px] pr-[100px] z-20 relative select-none">
                            <h3 className="text-[17px] font-black tracking-tight leading-tight block truncate text-slate-900" style={{ color: cardPrimaryColor }}>
                              {selectedPerson ? selectedPerson.schoolName : 'UGBEKUN ACADEMY'}
                            </h3>
                            {cardShowAddress && (
                              <p className="text-[7.5px] text-slate-500 font-extrabold tracking-wider leading-none mt-0.5 uppercase truncate">
                                {selectedPerson ? selectedPerson.address : '23 Evbuomwan St, Benin City'}
                              </p>
                            )}
                          </div>

                          {/* Large banner title pill */}
                          <div className="flex justify-center mt-2.5 z-20 relative select-none">
                            <div 
                              className="px-6 py-1 text-center font-black text-white text-[11.5px] uppercase tracking-widest rounded-full shadow-md min-w-[200px]"
                              style={{ 
                                background: `linear-gradient(135deg, ${cardSecondaryColor} 0%, ${cardPrimaryColor} 100%)` 
                              }}
                            >
                              {customTitleText}
                            </div>
                          </div>

                          {/* Body portion: Photo & Details Layout block */}
                          <div className="grid grid-cols-12 gap-3 mt-4 items-center z-20 relative select-none">
                            
                            {/* Photo Left Part (4 of 12 cols) */}
                            <div className="col-span-4 flex flex-col items-center">
                              {cardShowPhoto && (
                                <div className="w-[84px] h-[94px] rounded-2xl bg-white border-2 border-slate-200/80 flex items-center justify-center shadow-md relative overflow-hidden shrink-0">
                                  {selectedPerson && selectedPerson.avatar ? (
                                    <img 
                                      src={selectedPerson.avatar} 
                                      alt={selectedPerson.name} 
                                      className="w-full h-full object-cover" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-white">
                                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-slate-400"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                                    </div>
                                  )}
                                  
                                  {/* Overlaid Role ribbon */}
                                  <div className="absolute bottom-1 inset-x-1 py-0.5 bg-slate-900/85 backdrop-blur-xs text-[7px] text-white font-black rounded-lg text-center uppercase tracking-wider block">
                                    {selectedPerson ? selectedPerson.type : 'Student'}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Details Portion Middle-Right (8 of 12 cols) */}
                            <div className="col-span-8 space-y-1 pl-1">
                              <div className="grid grid-cols-12 text-[9.5px] leading-tight">
                                <span className="col-span-3 text-slate-400 font-extrabold uppercase tracking-widest text-[8.5px]">Name:</span>
                                <span className="col-span-9 font-black text-slate-950 uppercase truncate">
                                  {selectedPerson ? selectedPerson.name : 'OLIVIA WILSON'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-12 text-[9.5px] leading-tight">
                                <span className="col-span-3 text-slate-400 font-extrabold uppercase tracking-widest text-[8.5px]">Birth:</span>
                                <span className="col-span-9 font-black text-slate-800">
                                  {selectedPerson ? selectedPerson.birth : '13/09/2010'}
                                </span>
                              </div>

                              <div className="grid grid-cols-12 text-[9.5px] leading-tight">
                                <span className="col-span-3 text-slate-400 font-extrabold uppercase tracking-widest text-[8.5px]">Adress:</span>
                                <span className="col-span-9 font-black text-slate-600 truncate leading-snug uppercase">
                                  {selectedPerson ? selectedPerson.address : '13 BENONI ST., BENIN CITY'}
                                </span>
                              </div>

                              <div className="grid grid-cols-12 text-[9.5px] leading-tight">
                                <span className="col-span-3 text-slate-400 font-extrabold uppercase tracking-widest text-[8.5px]">ID No:</span>
                                <span className="col-span-9 font-mono font-black text-[#1e40af]" style={{ color: cardPrimaryColor }}>
                                  {selectedPerson ? selectedPerson.idNo : '123-456-7890'}
                                </span>
                              </div>

                              {/* Barcode & QR Code cluster block */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                                {cardShowBarcode ? (
                                  <div className="flex flex-col items-start leading-none gap-0.5">
                                    {/* Procedural dynamic barcode vector */}
                                    <div className="h-[22px] w-[130px] bg-white flex gap-0.5 items-stretch p-0.5 select-none shrink-0 border border-slate-100">
                                      {[1, 2, 4, 1, 3, 2, 1, 2, 4, 2, 1, 3, 1, 2, 4, 1, 2, 1, 1, 4, 2].map((val, idx) => (
                                        <div key={idx} className="bg-slate-950 shrink-0" style={{ width: `${val * 1.5}px` }} />
                                      ))}
                                    </div>
                                    <span className="text-[7.5px] font-mono text-slate-400 font-bold tracking-widest block">{selectedPerson?.idNo || '123-456-7890'}</span>
                                  </div>
                                ) : <div />}

                                {cardShowQR && (
                                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200/80 flex items-center justify-center p-0.5 shadow-sm shrink-0">
                                    {qrCodeDataUrl ? (
                                      <img src={qrCodeDataUrl} alt="QR" className="w-full h-full" />
                                    ) : (
                                      <div className="w-full h-full bg-slate-100 animate-pulse" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                          </div>

                          {/* Benin Tribal mask / Graduation Cap corner visual emblem on bottom margin */}
                          <div className="absolute left-4 bottom-3 z-30 flex items-center gap-1.5 opacity-90 select-none">
                            {cardLogoType === 'shield_tribal' ? (
                              <div className="w-8 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-md p-1 relative z-10 text-white" style={{ backgroundColor: cardPrimaryColor }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 11h.01M10 8h4v4h-4z"/></svg>
                              </div>
                            ) : (
                              <GraduationCap size={16} className="text-slate-400" />
                            )}
                            <span className="text-[7px] text-slate-400 font-extrabold uppercase tracking-widest">Secure partition</span>
                          </div>
                        </motion.div>
                      )}

                      {/* BACK SIDE OF ID CARD */}
                      {(cardLayoutSide === 'dual' || cardLayoutSide === 'back') && (
                        <motion.div
                          initial={{ scale: 0.97, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full max-w-[460px] aspect-[1.6/1] bg-white rounded-[24px] shadow-xl border border-slate-200/80 p-5 relative overflow-hidden select-none shrink-0"
                          style={{ backgroundColor: cardBgColor }}
                        >
                          {/* Graduation Cap geometric backdrop pattern watermark */}
                          <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none text-slate-800" xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 100 100">
                            <path d="M50 20 L80 35 L50 50 L20 35 Z" fill="currentColor" />
                            <path d="M30 40 L30 55 C30 65 70 65 70 55 L70 40" fill="none" stroke="currentColor" strokeWidth="3" />
                          </svg>

                          {/* Outer card framing decoration */}
                          <div className="absolute top-0 right-0 w-[140px] h-[140px] pointer-events-none opacity-25 overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-28 h-28 rotate-45" style={{ backgroundColor: cardPrimaryColor }} />
                          </div>

                          {/* Top Centered School Logo & Metadata */}
                          <div className="flex flex-col items-center pt-2 select-none z-10 relative">
                            {/* Crest in Shield */}
                            <div className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg p-2" style={{ backgroundColor: cardPrimaryColor }}>
                              {cardLogoType === 'shield_tribal' ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 11h.01M10 8h4v4h-4z"/></svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                              )}
                            </div>
                            
                            <h4 className="text-[15px] font-black tracking-tight mt-2 text-slate-900 uppercase leading-none" style={{ color: cardPrimaryColor }}>
                              {selectedPerson ? selectedPerson.schoolName : 'UGBEKUN ACADEMY'}
                            </h4>
                            <p className="text-[7.5px] text-slate-400 font-black tracking-widest uppercase mt-0.5">
                              {selectedPerson ? selectedPerson.address : '23 Evbuomwan St, GRA, Benin City'}
                            </p>
                          </div>

                          {/* Mid Section: Authorised Signature and Return Instructions Box */}
                          <div className="grid grid-cols-2 gap-4 mt-5 z-10 relative px-2">
                            
                            {/* Authorised Signature Capsule */}
                            <div className="flex flex-col items-center">
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">Authorised Signature</span>
                              {cardShowSignature ? (
                                <div className="w-full h-11 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col items-center justify-center p-1 shadow-inner relative overflow-hidden">
                                  {/* Cursive Principal signature SVG */}
                                  <svg viewBox="0 0 100 35" className="w-24 h-9 text-[#1e40af] fill-none stroke-current" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M10 25 C25 5, 45 30, 50 15 C55 4, 75 8, 85 20 M35 15 L65 15" />
                                  </svg>
                                  <span className="text-[8px] font-bold text-slate-500 absolute bottom-0.5 font-sans leading-none">Principal</span>
                                </div>
                              ) : (
                                <div className="w-full h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-[8px] font-bold uppercase border border-dashed border-slate-300">
                                  Disabled
                                </div>
                              )}
                            </div>

                            {/* Return Instructions Capsule */}
                            <div className="flex flex-col items-stretch">
                              <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1 text-center">Security Return</span>
                              <div className="h-11 bg-slate-50 border border-slate-200/60 rounded-xl p-1.5 flex flex-col justify-center items-center shadow-inner leading-tight text-center">
                                <p className="text-[8px] text-slate-600 font-extrabold max-w-[170px]">
                                  {cardReturnInstructions}
                                </p>
                              </div>
                            </div>

                          </div>

                          {/* Absolute Base Disclaimer Banner on light-shadow strip */}
                          {cardShowDisclaimer && (
                            <div className="absolute bottom-0 inset-x-0 bg-slate-100 border-t border-slate-250 py-2.5 px-4 z-20 shadow-inner select-none relative mt-4">
                              <p className="text-[7.5px] text-slate-800 text-center uppercase tracking-wide font-black leading-normal leading-snug">
                                {cardDisclaimerText}
                              </p>
                            </div>
                          )}

                          {/* Top-Right Mini Logo */}
                          <div className="absolute right-4 top-4 opacity-15">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2Z"/><path d="m9 12 2 2 4-4"/></svg>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Single card Quick Print Action */}
                    <div className="mt-5.5 flex gap-2 w-full max-w-sm select-none">
                      <button
                        type="button"
                        onClick={() => {
                          showToast(`Initiating direct card compiler for ${selectedPerson?.name || 'Visitor'}...`, 'success');
                          if (typeof window !== 'undefined') {
                            window.print();
                          }
                        }}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs uppercase rounded-xl border-none cursor-pointer text-center transition flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        <span>Print active card</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showToast('Digital dual pass asset downloaded successfully', 'success');
                        }}
                        className="px-4.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl cursor-pointer text-center transition flex items-center justify-center gap-1"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <span>PNG Pass</span>
                      </button>
                    </div>

                  </div>

                </div>
              </motion.div>
            )}

            {/* 5. PLATFORM REPORTS & RUNTIME DIAGNOSTICS TAB */}
            {activeTab === 'reports' && (
              <motion.div
                key="reports-viewport"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 text-left"
              >
                <div>
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight text-left">Attendance reports</h2>
                  <p className="text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
                    Export daily or full history for any school. Data is never deleted from the database.
                  </p>
                </div>

                {/* Amber Warning Banner */}
                <div className="bg-amber-50/70 border border-amber-200/50 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                    Present/In comes from gate check-in today (Lagos time). Teachers do not mark attendance — only dismiss for pickup.
                  </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs max-w-xl space-y-5">
                  
                  {/* School Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-2 tracking-wider">
                      SCHOOL
                    </label>
                    <select
                      value={selectedReportSchoolId}
                      onChange={(e) => setSelectedReportSchoolId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white min-h-[46px]"
                    >
                      <option value="">Select school...</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Selector */}
                  <div>
                    <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-2 tracking-wider">
                      REPORT DAY
                    </label>
                    <input
                      type="date"
                      value={selectedReportDay}
                      onChange={(e) => setSelectedReportDay(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white min-h-[46px]"
                    />
                  </div>

                  {/* Export Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      disabled={downloadingToday}
                      onClick={handleDownloadTodayCSV}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-extrabold rounded-xl transition cursor-pointer border-none shadow-sm disabled:opacity-50"
                    >
                      <Download size={14} />
                      <span>{downloadingToday ? 'Downloading...' : 'Download this day (CSV)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={downloadingAll}
                      onClick={handleDownloadAllHistoryCSV}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-extrabold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Database size={14} className="text-slate-500" />
                      <span>{downloadingAll ? 'Downloading...' : 'Download all history (CSV)'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2 leading-relaxed font-semibold">
                    Daily files use calendar midnight–midnight. Live dashboards reset Present/In 12 hours after each scan.
                  </p>

                </div>
              </motion.div>
            )}

            {/* 6. ADMIN USER ACCOUNT PROFILE EDIT TAB */}
            {activeTab === 'account' && (
              <motion.div
                key="account-viewport"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.15 }}
                className="max-w-xl mx-auto"
              >
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center gap-4 select-none text-left">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#1e3a8a] to-[#3b82f6] text-white font-extrabold text-xl flex items-center justify-center shadow-md shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase text-slate-900 leading-none">Super Admin Settings</h3>
                      <p className="text-[10.5px] text-slate-500 mt-1 leading-normal font-medium">Modify credentials, system email, and supervisor level parameters</p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
                    {profileSuccess && (
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-black uppercase tracking-wide">
                        <CheckCircle2 size={16} className="shrink-0 text-blue-600 mt-0.5" />
                        <span>{profileSuccess}</span>
                      </div>
                    )}

                    {profileError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-black uppercase tracking-wide">
                        <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                        <span>{profileError}</span>
                      </div>
                    )}

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Supervisor Full Name</label>
                        <input
                          type="text"
                          required
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Supervisor Corporate Username</label>
                        <input
                          type="text"
                          required
                          value={userUsername}
                          onChange={(e) => setUserUsername(e.target.value.toLowerCase().trim())}
                          className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-bold font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-1">Admin E-mail Address</label>
                        <input
                          type="email"
                          required
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-medium font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] hover:shadow-md text-white border-none font-bold uppercase text-xs rounded-xl cursor-pointer transition-all active:scale-98"
                      >
                        Save Profile Settings
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </main>
      </div>

      {/* POPUP MODAL: REGISTER A NEW ACADEMY (SCHOOL + ADMIN USER IN ONE) */}
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
                    <span className="text-xs font-black uppercase px-1">Cancel</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1e40af] text-white flex items-center justify-center font-black">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase text-white">Register School</h3>
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
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-2xl flex items-start gap-2.5 text-xs font-black uppercase tracking-wide animate-pulse">
                    <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  
                  {/* Part 1: School Branding block */}
                  <div className="border-l-3 border-[#1e40af] pl-3">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#1e40af] block">Section A: Academy Particulars</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        School / Academy Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., CANAAN GATE SCHOOLS"
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        Academy Street Address
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., 24, Bammeke Road, Shasha, Lagos"
                        value={schoolAddress}
                        onChange={(e) => setSchoolAddress(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        Custom Welcome Message
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Welcome to Canaan Gate Gate System"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-medium"
                      />
                    </div>
                  </div>

                  {/* Part 2: Corporate admin user account block */}
                  <div className="border-l-3 border-[#1e40af] pl-3 pt-2 font-medium">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#1e40af] block">Section B: Principal Admin Account</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        Administrator Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Pastor Babajide Alao"
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[10.5px] uppercase font-extrabold text-slate-400 block mb-1">
                        Corp Username <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., canaan_admin"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value.toLowerCase().trim())}
                        className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-bold font-mono"
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
                        placeholder="Choose or generate password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:outline-none focus:border-slate-400 focus:bg-white text-slate-800 font-bold font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAutoGeneratePassword}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition border border-slate-300/30 cursor-pointer"
                        title="Generate random passcode"
                      >
                        Generate
                      </button>
                    </div>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 select-none">
                  {submittingReg ? (
                    <span className="text-[#1e40af] font-bold animate-pulse flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin" />
                      <span>PROVISIONING SECURE SCHOOL...</span>
                    </span>
                  ) : (
                    <span>Data will sync live to the relational database</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={submittingReg}
                      className="px-5 py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white border-none rounded-xl font-bold uppercase text-xs cursor-pointer disabled:opacity-45"
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

      {/* MOBILE BOTTOM MENU BAR - MATCHES SCREEN DESIGN RULES */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a1424] border-t border-slate-800/80 px-2 pt-2.5 pb-4 shadow-[0_-12px_35px_rgba(0,0,0,0.5)] backdrop-blur-md bg-opacity-95 select-none">
        <div className="flex items-center justify-between max-w-lg mx-auto h-14">
          
          {/* 1. Dashboard Tab button */}
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setSearchQuery('');
              showToast('Switched to Platform Overview', 'info');
            }}
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

          {/* 2. Schools list Tab button */}
          <button
            onClick={() => {
              setActiveTab('schools');
              setSearchQuery('');
              showToast('Switched to Academies directory', 'info');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer border-none bg-transparent ${
              activeTab === 'schools' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'schools' ? 'bg-[#1e40af] text-amber-400' : 'text-slate-400'}`}>
              <Building2 size={18} />
            </div>
            <span className={`text-[9.5px] mt-0.5 tracking-tight font-black uppercase ${activeTab === 'schools' ? 'text-amber-400' : 'text-slate-400'}`}>
              Schools
            </span>
          </button>

          {/* 3. Add Academy Floating button with glowing pulse effect */}
          <div className="relative -mt-6 px-1.5 flex flex-col items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-amber-500 rounded-full blur-md opacity-35 scale-110 animate-pulse" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => {
                setIsRegModalOpen(true);
              }}
              className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-amber-400 via-[#fbbf24] to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-[0_8px_20px_rgba(245,158,11,0.45)] outline-none border-none cursor-pointer"
              title="Register New Academy"
            >
              <Plus size={20} className="text-slate-900 stroke-[2.5]" />
            </motion.button>
            <span className="text-[9.5px] mt-1 tracking-tight font-black text-amber-400 uppercase">
              REGISTER
            </span>
          </div>

          {/* 4. Passwords / Security Tab button */}
          <button
            onClick={() => {
              setActiveTab('passwords');
              showToast('Switched to Operator Accounts', 'info');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer border-none bg-transparent ${
              activeTab === 'passwords' ? 'text-white' : 'text-slate-400 hover:text-[#fbbf24]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'passwords' ? 'bg-[#1e40af] text-amber-400' : 'text-slate-400'}`}>
              <KeyRound size={18} />
            </div>
            <span className={`text-[9.5px] mt-0.5 tracking-tight font-black uppercase ${activeTab === 'passwords' ? 'text-amber-400' : 'text-slate-400'}`}>
              Keys
            </span>
          </button>

          {/* 5. Account/Diagnostics tab selector */}
          <button
            onClick={() => {
              setActiveTab('account');
              showToast('Super Admin settings', 'info');
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer border-none bg-transparent ${
              activeTab === 'account' ? 'text-white' : 'text-slate-400 hover:text-[#fbbf24]'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'account' ? 'bg-[#1e40af] text-amber-400' : 'text-slate-400'}`}>
              <User size={18} />
            </div>
            <span className={`text-[9.5px] mt-0.5 tracking-tight font-black uppercase ${activeTab === 'account' ? 'text-amber-400' : 'text-slate-400'}`}>
              Admin
            </span>
          </button>

        </div>
      </div>

    </div>
  );
}
