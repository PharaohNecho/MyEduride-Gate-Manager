'use client';

import { useState, useEffect } from 'react';
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
  Info
} from 'lucide-react';

const LOGO_URL = 'https://www.image2url.com/r2/default/images/1779230378321-292c7b74-6217-41ff-832a-180a535ea4cb.png';

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

export default function RegisterSchoolPage() {
  const [schoolName, setSchoolName] = useState('');
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !adminFullName.trim() || !adminUsername.trim() || !adminPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    // Client-side username layout validation
    const usernameRegex = /^[a-zA-Z0-9._-]+$/;
    if (!usernameRegex.test(adminUsername)) {
      setError('Username can only contain letters, numbers, dots, and underscores. Spaces or emails are not allowed.');
      return;
    }

    if (adminPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/schools/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          adminFullName,
          adminUsername,
          adminPassword,
          welcomeMessage,
        }),
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: text };
      }

      if (!response.ok) {
        setError(data.error || 'Failed to register school.');
        setLoading(false);
        return;
      }

      setSuccess(
        data.message || 'School registered successfully! You can now log in with your administrative credentials.'
      );
      
      // Reset fields on success
      setSchoolName('');
      setAdminFullName('');
      setAdminUsername('');
      setAdminPassword('');
      setWelcomeMessage('');
    } catch {
      setError('Network error occurs. Please verify your internet connection or try again later.');
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#070b19] p-4 sm:p-6 md:p-10 selection:bg-[#fbbf24] selection:text-slate-900">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[#070b19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/25 via-[#070b19] to-[#03050c]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#1e3a8a_0%,_transparent_45%),_radial-gradient(circle_at_80%_80%,_#f59e0b_0%,_transparent_45%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Main Split-Screen Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        id="register_main_container"
        className="relative z-10 w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5 bg-gradient-to-r from-[#111827] via-[#1e3a8a] to-[#1e40af] grid grid-cols-1 md:grid-cols-12 min-h-[660px]"
      >
        {/* Soft-Focus Dynamic Tech Particles (matches Login Page consistency) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
          <div className="absolute -top-12 -left-12 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-[pulse_10s_infinite_ease-in-out_alternate]" />
          <div className="absolute -bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-[80px] animate-[pulse_14s_infinite_ease-in-out_alternate_2s]" />
        </div>

        {/* Left Side: White Form Card Pane */}
        <div 
          id="register_form_pane" 
          className="col-span-1 md:col-span-5 bg-white p-6 sm:p-8 flex flex-col justify-between relative shadow-2xl z-20 text-left"
        >
          <div className="space-y-6">
            {/* Top Logo Widget */}
            <div className="flex items-center justify-between">
              <a href="/auth/login" className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-[#1e3a8a] transition group gap-1">
                <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span>Sign In</span>
              </a>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#1e40af] p-1.5 shadow-sm">
                <img src={LOGO_URL} alt="MyEduRide" className="w-full h-full object-contain filter brightness-0 invert" />
              </div>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">Register School</h1>
              <p className="text-xs text-slate-400 mt-1.5 font-medium leading-relaxed">
                Empower your institution with real-time gate validation, customized parent clearance, and offline-persistent student RFID dispatch coordination.
              </p>
            </div>

            {success ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5 py-4 text-center"
              >
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 shadow-sm text-left">
                  <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm mb-1.5">
                    <ShieldCheck size={18} />
                    <span>Setup Configured Successfully!</span>
                  </div>
                  <p className="text-xs text-emerald-600/95 leading-relaxed font-semibold">
                    {success} Your administrator credentials and school sync keys are registered.
                  </p>
                </div>
                
                <a
                  href="/auth/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white font-extrabold text-sm transition hover:opacity-95 active:scale-[0.98] shadow-lg shadow-blue-900/15 cursor-pointer border-none"
                >
                  <span>Proceed to Gate Terminal</span>
                  <ChevronRight size={16} />
                </a>
              </motion.div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
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
                  {/* Category 1: School Profile */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-100 pb-0.5">School Details</p>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">School Name *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <School size={14} />
                        </span>
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="Greenwood Academy"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Welcome Message <span className="text-[9px] text-slate-400 lowercase">(optional)</span></label>
                      <input
                        type="text"
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="e.g. Welcome to Greenwood Pickups portal"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Category 2: Admin setup */}
                  <div className="space-y-2.5 pt-1">
                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-100 pb-0.5">Administrative Profile</p>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Full Name *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <User size={14} />
                        </span>
                        <input
                          type="text"
                          required
                          value={adminFullName}
                          onChange={(e) => setAdminFullName(e.target.value)}
                          placeholder="Dr. Adaeze Okechukwu"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Admin Username *</label>
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="e.g. adaeze_admin"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
                      />
                      <p className="text-[9px] text-slate-400 mt-1 font-medium select-none">Alphanumeric handle used to log in (no spaces/emails).</p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Password *</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                          <Lock size={14} />
                        </span>
                        <input
                          type="password"
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1e3a8a] focus:bg-white transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full relative overflow-hidden mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white font-extrabold text-xs transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.98] shadow-lg shadow-blue-900/10 text-center min-h-[44px] cursor-pointer border-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Provisioning Secure Nodes...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <span>Complete Setup & Register</span>
                      <ArrowRight size={14} />
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col items-center gap-1.5 text-center">
            <p className="text-[11px] text-slate-500 font-semibold uppercase">
              Already Setup?{' '}
              <a href="/auth/login" className="text-[#1040af] hover:underline font-extrabold underline-offset-2">
                Log In To Gateway Terminal &rsaquo;
              </a>
            </p>
            <p className="text-[9px] text-[#94a3b8] font-bold">MyEduRide — Guarding Student Safety Protocols</p>
          </div>
        </div>

        {/* Right Side: Violet/Indigo Theme Testimonials Carousel (Matches Sample 2) */}
        <div 
          id="register_illustration_pane" 
          className="hidden md:col-span-12 md:flex lg:col-span-7 bg-gradient-to-br from-[#4f46e5]/90 via-[#311042]/95 to-[#0f172a] p-10 relative overflow-hidden flex-col justify-between text-white"
        >
          {/* Wave Pattern vectors in background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.25] z-0">
            <svg width="100%" height="100%" className="absolute inset-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M-100 100 Q 150 300, 400 100 T 900 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
              <path d="M-100 200 Q 200 450, 500 200 T 1100 200" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            </svg>
            <div className="absolute -top-12 -right-12 w-80 h-80 border-2 border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
            <div className="absolute bottom-24 -left-12 w-64 h-64 border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <span className="px-3 py-1 text-[10px] font-extrabold tracking-widest text-[#fbbf24] bg-white/10 rounded-full uppercase flex items-center gap-1 border border-white/10">
              <Sparkles size={11} className="animate-pulse" />
              <span>Safety Integration Roster</span>
            </span>
            <span className="text-[10px] font-extrabold text-indigo-300 uppercase select-none tracking-wider">Gate Safety Suite</span>
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
                  <div className="absolute -bottom-2 -right-2 bg-[#fbbf24] text-slate-900 p-1.5 rounded-full shadow-md border-2 border-white">
                    <Star size={12} className="fill-current stroke-[2.5]" />
                  </div>
                </div>

                {/* Name & Title */}
                <div className="mt-4 text-center">
                  <h3 className="font-extrabold text-white text-base leading-tight tracking-tight">
                    {CAROUSEL_SLIDES[currentSlide].name}
                  </h3>
                  <p className="text-[11px] text-indigo-200 mt-1 font-bold uppercase tracking-wider">
                    {CAROUSEL_SLIDES[currentSlide].role}
                  </p>
                </div>

                {/* Message Quote Balloon */}
                <div className="mt-5 w-full bg-slate-950/40 border border-white/5 backdrop-blur-md p-4 rounded-2xl relative text-center text-xs leading-relaxed">
                  <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 bg-slate-950/40 rotate-45 border-l border-t border-white/5" />
                  <p className="relative z-10 text-indigo-100 font-medium italic">
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
                onClick={prevSlide}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white cursor-pointer pointer-events-auto border-none focus:outline-none"
              >
                <ArrowLeft size={14} />
              </button>
              <button 
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
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer border-none bg-white ${
                    currentSlide === idx ? 'w-8 opacity-100 bg-amber-400' : 'w-2.5 opacity-30 hover:opacity-50'
                  }`}
                />
              ))}
            </div>

            <div className="text-center max-w-sm mx-auto">
              <h2 className="text-sm font-extrabold text-white">Loved by School Boards & Parents</h2>
              <p className="text-[11px] text-indigo-200/70 mt-1 leading-normal font-medium">
                Our RFID matching technology prevents mismatch hangups, secures dismissal permissions, and updates coordinators in sub-second timelines.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
