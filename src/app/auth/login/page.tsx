'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  School, 
  User, 
  Lock, 
  Check, 
  Sparkles, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';

const FALLBACK_LOGO_URL = 'https://www.image2url.com/r2/default/images/1779230378321-292c7b74-6217-41ff-832a-180a535ea4cb.png';

type SchoolBranding = {
  id: string;
  name: string;
  logo_url?: string | null;
  welcome_message?: string | null;
};

const CAROUSEL_SLIDES = [
  {
    id: 1,
    name: 'Mrs. Sarah Adebayo',
    role: 'Principal, Greenwood Academy',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=640',
    quote: '"MyEduRide completely synchronized our school gates. Everyday student dismissal safety improved by 100%, saving us critical hours."',
    badgeText: '🏆 Principal Endorsed',
    stat: '45min Saved Daily',
  },
  {
    id: 2,
    name: 'Mr. Olumide Johnson',
    role: 'Parent of Grade 4 Student',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=640',
    quote: '"No more high-stress dispatch gate crowds. Instant notifications keep me assured that my children are cleared and safe in real-time."',
    badgeText: '⚡ Parents Choice',
    stat: '100% Real-time Sync',
  },
  {
    id: 3,
    name: 'CSO Kola Adeleke',
    role: 'Security lead, Lagos Intl',
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=640',
    quote: '"Authenticating matching gate passes prevents unauthorized pickup delegation in seconds. The ultimate guard layer for any academy."',
    badgeText: '🛡️ Secured RFID Node',
    stat: 'Zero Release Breaches',
  }
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameHint, setUsernameHint] = useState('');
  const [loginSchoolId, setLoginSchoolId] = useState('');
  const [schoolBranding, setSchoolBranding] = useState<SchoolBranding | null>(null);
  const brandingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const urlSchoolBranding = useRef<SchoolBranding | null>(null);

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Vaporize legacy session and cookies on load to prevent stale state from hijacking the next login session
    localStorage.removeItem('myeduride_session');
    document.cookie = 'myeduride_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    document.cookie = 'myeduride_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure;';
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('school_id');
    if (!sid) return;

    setLoginSchoolId(sid);
    fetch(`/api/public/school-branding?school_id=${sid}`)
      .then((r) => r.json())
      .then((d) => {
        const school = d.school || null;
        urlSchoolBranding.current = school;
        setSchoolBranding(school);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const trimmed = username.trim();
    if (brandingTimer.current) clearTimeout(brandingTimer.current);

    if (trimmed.length < 3) {
      setUsernameHint('');
      setSchoolBranding(urlSchoolBranding.current);
      return;
    }

    brandingTimer.current = setTimeout(() => {
      const params = new URLSearchParams({ username: trimmed });
      if (loginSchoolId) params.set('school_id', loginSchoolId);

      fetch(`/api/public/login-branding?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => {
          if (loginSchoolId) {
            if (d.belongs_to_school && d.school) {
              setUsernameHint('');
              setSchoolBranding(d.school);
            } else {
              setUsernameHint(
                d.error || 'This username is not registered at this school.'
              );
              setSchoolBranding(urlSchoolBranding.current);
            }
            return;
          }

          setUsernameHint('');
          if (d.school) setSchoolBranding(d.school);
        })
        .catch(() => {});
    }, 400);

    return () => {
      if (brandingTimer.current) clearTimeout(brandingTimer.current);
    };
  }, [username, loginSchoolId]);

  const logoSrc = schoolBranding?.logo_url
    ? `/api/photo?path=${encodeURIComponent(schoolBranding.logo_url)}`
    : FALLBACK_LOGO_URL;

  const welcomeLine =
    schoolBranding?.welcome_message ||
    (schoolBranding?.name ? `Welcome to ${schoolBranding.name}` : 'Sign in to access secure dispatch credentials & RFID nodes.');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    if (usernameHint) {
      setError(usernameHint);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          school_id: loginSchoolId || undefined,
        }),
      });

      const text = await response.text();
      let data: { error?: string; session?: any } = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!response.ok) {
        setError(data.error || 'Failed to sign in. Please verify your credentials.');
        setLoading(false);
        return;
      }

      if (data.session) {
        localStorage.setItem('myeduride_session', JSON.stringify(data.session));
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + CAROUSEL_SLIDES.length) % CAROUSEL_SLIDES.length);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#040814] p-4 sm:p-6 md:p-10 selection:bg-[#fbbf24] selection:text-slate-900">
      {/* Background ambient lighting - Theme Custom Logo Scheme (Navy Blue + Road Green + Gold) */}
      <div className="absolute inset-0 bg-[#040814]">
        {/* Glow gradients matching MyEduRide color scheme: Deep Navy, Fresh Forest Green, Warm Gold */}
        <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_20%_25%,_#0c2540_0%,_transparent_55%),_radial-gradient(circle_at_80%_75%,_#0b361a_0%,_transparent_55%),_radial-gradient(circle_at_50%_50%,_#783c07_0%,_transparent_60%)] blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Main Split-Screen Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        id="login_main_container"
        className="relative z-10 w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-white/5 bg-gradient-to-r from-[#0a1e36] via-[#092e1b] to-[#040d1f] grid grid-cols-1 md:grid-cols-12 min-h-[660px]"
      >
        {/* Soft-Focus Dynamic Tech Background Particles & Floating Blobs in Logo Colours */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-50">
          {/* Animated Deep Shield Navy Blob */}
          <div className="absolute -top-12 -left-12 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-[pulseBlob_11s_infinite_ease-in-out_alternate]" />
          {/* Animated Road Green Blob */}
          <div className="absolute -bottom-20 right-20 w-80 h-80 bg-emerald-600/15 rounded-full blur-[80px] animate-[pulseBlob_15s_infinite_ease-in-out_alternate_2s]" />
          {/* Floating Gold Spark Dust Particles representing the safety star */}
          <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-emerald-400/30 rounded-full blur-[1px] animate-[bubbleUp_12s_infinite_linear]" />
          <div className="absolute top-[60%] left-[15%] w-3 h-3 bg-amber-400/25 rounded-full blur-[2px] animate-[bubbleUp_18s_infinite_linear_2s]" />
          <div className="absolute top-[40%] right-[25%] w-2.5 h-2.5 bg-blue-400/20 rounded-full blur-[1px] animate-[bubbleUp_16s_infinite_linear_1s]" />
          <div className="absolute bottom-[20%] right-[40%] w-3.5 h-3.5 bg-emerald-500/15 rounded-full blur-[3px] animate-[bubbleUp_20s_infinite_linear_3s]" />
          <div className="absolute top-[10%] right-[10%] w-2 h-2 bg-amber-300/30 rounded-full blur-[1px] animate-[bubbleUp_15s_infinite_linear_4s]" />
        </div>

        {/* Left Side: White Form Card Pane */}
        <div 
          id="login_form_pane" 
          className="col-span-1 md:col-span-5 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl z-20 text-left transition-colors"
        >
          <div className="space-y-6">
            {/* Top Logo Widget */}
            <div className="flex items-center justify-between">
              <div id="school_logo_box" className="flex items-center space-x-2.5">
                <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#0a1e36] to-[#04341b] p-1.5 shadow-md border border-slate-100 dark:border-slate-800 overflow-hidden">
                  <img 
                    src={logoSrc} 
                    alt={schoolBranding?.name || 'MyEduRide'} 
                    className="w-full h-full object-contain filter brightness-100 invert-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_LOGO_URL;
                    }}
                  />
                </div>
                <div className="leading-tight">
                  {schoolBranding?.name ? (
                    <h2 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 line-clamp-1">{schoolBranding.name}</h2>
                  ) : (
                    <h2 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">MyEduRide Platform</h2>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h1 id="welcome_back_title" className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">Sign In Access</h1>
              <p id="welcome_back_subtitle" className="text-xs text-slate-400 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                {welcomeLine}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-xs text-rose-700 font-bold"
                >
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="space-y-3.5">
                {/* Username Input with clean styling */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Username *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <User size={14} />
                    </span>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. adaeze_admin"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-450 focus:outline-none focus:border-[#0f3b25] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                  {usernameHint ? (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] text-amber-600 mt-1 font-semibold pl-1 flex items-center gap-1"
                    >
                      <span>⚠️</span> {usernameHint}
                    </motion.p>
                  ) : (
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 pl-1 mt-1 font-medium select-none">Enter your username to dynamic-sync local school nodes.</p>
                  )}
                </div>

                {/* Password Input with clean visibility toggle */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Lock size={14} />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter security key"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-450 focus:outline-none focus:border-[#0f3b25] dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition h-[34px] w-[34px] flex items-center justify-center z-10 focus:outline-none border-none bg-transparent cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-0.5">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold hover:text-slate-500 cursor-not-allowed select-none">
                    Forgot Password?
                  </span>
                </div>
              </div>

              {/* Main submit utilizing the logo's fresh green and deep blue combo gradient! */}
              <button
                type="submit"
                disabled={loading || !username.trim() || !password.trim()}
                className="w-full relative overflow-hidden mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-[#0a1e36] to-[#0d5c2e] text-white font-extrabold text-xs transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.98] shadow-lg shadow-emerald-900/15 text-center min-h-[44px] cursor-pointer border-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Authenticating credentials...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <span>Access Dashboard</span>
                    <ArrowRight size={14} />
                  </span>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center gap-1.5 text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
              New School Platform?{' '}
              <a href="/auth/register-school" className="text-[#0d5c2e] dark:text-emerald-450 hover:underline font-extrabold underline-offset-2">
                Register School &rsaquo;
              </a>
            </p>
            <p className="text-[9px] text-[#94a3b8] dark:text-slate-500 font-bold">MyEduRide — Guarding Student Safety Protocols</p>
          </div>
        </div>

        {/* Right Side: Emerald/Navy/Gold Theme Testimonials Carousel (Matching Sample 2 style / Register School) */}
        <div 
          id="login_illustration_pane" 
          className="hidden md:col-span-12 md:flex lg:col-span-7 bg-gradient-to-br from-[#0c1f38]/95 via-[#0b2b18]/95 to-[#050c18] p-10 relative overflow-hidden flex-col justify-between text-white"
        >
          {/* Wave and circle vectors matching MyEduRide theme */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.25] z-0">
            <svg width="100%" height="100%" className="absolute inset-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M-100 100 Q 150 300, 400 100 T 900 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              <path d="M-100 200 Q 200 450, 500 200 T 1100 200" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            </svg>
            {/* Animated Ring 1 */}
            <div className="absolute -top-12 -right-12 w-80 h-80 border-2 border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
            {/* Animated Ring 2 */}
            <div className="absolute bottom-24 -left-12 w-64 h-64 border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 text-[10px] font-extrabold tracking-widest text-[#fbbf24] bg-white/10 rounded-full uppercase flex items-center gap-1 border border-white/10">
              <Sparkles size={11} className="animate-pulse" />
              <span>Safety Integration Roster</span>
            </span>
            <span className="text-[10px] font-extrabold text-emerald-300 uppercase select-none tracking-wider">Gate Safety Suite</span>
          </div>

          {/* Testimonial Presentation */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.45 }}
                className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 relative flex flex-col items-center select-none shadow-2xl"
              >
                {/* Floating Highlight Badge (Sample 2 style) */}
                <div className="absolute -top-3.5 left-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-black px-3.5 py-1 rounded-full shadow-lg border-2 border-white/10 flex items-center gap-1">
                  <Check size={11} className="stroke-[3]" />
                  <span>{CAROUSEL_SLIDES[currentSlide].stat}</span>
                </div>

                {/* Portrait Container */}
                <div className="relative mt-2">
                  <img 
                    className="w-28 h-28 rounded-3xl object-cover shadow-xl border-4 border-white/20 select-none referrerPolicy='no-referrer'" 
                    src={CAROUSEL_SLIDES[currentSlide].image} 
                    alt={CAROUSEL_SLIDES[currentSlide].name} 
                    referrerPolicy="no-referrer"
                  />
                  {/* Sun Amber Gold stars on the highlight */}
                  <div className="absolute -bottom-2 -right-2 bg-[#fbbf24] text-slate-900 p-1.5 rounded-full shadow-md border-2 border-white">
                    <Star size={12} className="fill-current stroke-[2.5]" />
                  </div>
                </div>

                {/* Name & Title */}
                <div className="mt-4 text-center">
                  <h3 className="font-extrabold text-white text-base leading-tight tracking-tight">
                    {CAROUSEL_SLIDES[currentSlide].name}
                  </h3>
                  <p className="text-[11px] text-emerald-200 mt-1 font-bold uppercase tracking-wider">
                    {CAROUSEL_SLIDES[currentSlide].role}
                  </p>
                </div>

                {/* Message Quote Balloon */}
                <div className="mt-5 w-full bg-slate-950/40 border border-white/5 backdrop-blur-md p-4 rounded-2xl relative text-center text-xs leading-relaxed">
                  <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 bg-slate-950/40 rotate-45 border-l border-t border-white/5" />
                  <p className="relative z-10 text-emerald-100 font-medium italic">
                    {CAROUSEL_SLIDES[currentSlide].quote}
                  </p>
                </div>

                {/* Secondary badge indicator (Sample 2 style) */}
                <div className="absolute -bottom-3 right-6 bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full shadow-md border-2 border-white/15">
                  <span>{CAROUSEL_SLIDES[currentSlide].badgeText}</span>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Left & Right arrow controls */}
            <div className="absolute inset-x-0 top-1/2 -mt-4 flex items-center justify-between pointer-events-none px-2 lg:px-4">
              <button 
                type="button"
                onClick={prevSlide}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white cursor-pointer pointer-events-auto border-none focus:outline-none"
              >
                <ArrowLeft size={14} />
              </button>
              <button 
                type="button"
                onClick={nextSlide}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white cursor-pointer pointer-events-auto border-none focus:outline-none"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Dots and bottom copy */}
          <div className="relative z-10 space-y-4">
            <div className="flex justify-center items-center gap-2">
              {CAROUSEL_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer border-none bg-white ${
                    currentSlide === idx ? 'w-8 opacity-100 bg-amber-400' : 'w-2.5 opacity-30 hover:opacity-50'
                  }`}
                />
              ))}
            </div>

            <div className="text-center max-w-sm mx-auto">
              <h2 className="text-sm font-extrabold text-white">Loved by School Boards & Parents</h2>
              <p className="text-[11px] text-emerald-200/70 mt-1 leading-normal font-medium">
                Our RFID matching technology prevents mismatch hangups, secures dismissal permissions, and updates coordinators in sub-second timelines.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Styled custom CSS animation animations matching register school & branding */}
      <style jsx global>{`
        @keyframes pulseBlob {
          0% { transform: scale(1) translate(0px, 0px); opacity: 0.5; }
          50% { transform: scale(1.15) translate(30px, -20px); opacity: 0.85; }
          100% { transform: scale(0.9) translate(-15px, 15px); opacity: 0.5; }
        }
        @keyframes bubbleUp {
          0% { transform: translateY(500px) translateX(0) scale(0.8); opacity: 0; }
          15% { opacity: 0.7; }
          85% { opacity: 0.7; }
          100% { transform: translateY(-100px) translateX(55px) scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
