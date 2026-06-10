'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';

const FALLBACK_LOGO_URL = 'https://www.image2url.com/r2/default/images/1779230378321-292c7b74-6217-41ff-832a-180a535ea4cb.png';

type SchoolBranding = {
  id: string;
  name: string;
  logo_url?: string | null;
  welcome_message?: string | null;
};

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
    (schoolBranding?.name ? `Welcome to ${schoolBranding.name}` : 'Sign in to your corporate or personal account');

  const handleLogin = async () => {
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
        setError(data.error || 'Failed to sign in.');
        setLoading(false);
        return;
      }

      if (data.session) {
        localStorage.setItem('myeduride_session', JSON.stringify(data.session));
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Check your connection.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#070b19] p-4 sm:p-6 md:p-10 selection:bg-[#fbbf24] selection:text-slate-900">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-[#070b19] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-950/25 via-[#070b19] to-[#03050c]">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,_#1e3a8a_0%,_transparent_45%),_radial-gradient(circle_at_80%_80%,_#f59e0b_0%,_transparent_45%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        id="login_main_container"
        className="relative z-10 w-full max-w-5xl rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/5 bg-gradient-to-r from-[#111827] via-[#1e3a8a] to-[#1e40af] grid grid-cols-1 md:grid-cols-12 min-h-[620px]"
      >
        {/* Soft-Focus Dynamic Tech Background Particles & Floating Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Animated Blob 1 */}
          <div className="absolute -top-12 -left-12 w-96 h-96 bg-blue-500/15 rounded-full blur-[100px] animate-[pulseBlob_10s_infinite_ease-in-out_alternate]" />
          {/* Animated Blob 2 */}
          <div className="absolute -bottom-20 right-20 w-80 h-80 bg-amber-500/10 rounded-full blur-[80px] animate-[pulseBlob_14s_infinite_ease-in-out_alternate_2s]" />
          {/* Real-time floating dust/particles for Gate Safety / Dispatch vibes */}
          <div className="absolute top-[20%] left-[30%] w-2 h-2 bg-blue-400/30 rounded-full blur-[1px] animate-[bubbleUp_12s_infinite_linear]" />
          <div className="absolute top-[60%] left-[15%] w-3 h-3 bg-amber-400/20 rounded-full blur-[2px] animate-[bubbleUp_18s_infinite_linear_2s]" />
          <div className="absolute top-[40%] right-[25%] w-2.5 h-2.5 bg-white/20 rounded-full blur-[1px] animate-[bubbleUp_16s_infinite_linear_1s]" />
          <div className="absolute bottom-[20%] right-[40%] w-3.5 h-3.5 bg-indigo-400/15 rounded-full blur-[3px] animate-[bubbleUp_20s_infinite_linear_3s]" />
          <div className="absolute top-[10%] right-[10%] w-2 h-2 bg-blue-300/30 rounded-full blur-[1px] animate-[bubbleUp_15s_infinite_linear_4s]" />
        </div>

        {/* Left Side: White Login Form Card */}
        <div id="login_form_pane" className="col-span-1 md:col-span-5 bg-white p-8 sm:p-10 flex flex-col justify-between relative shadow-2xl z-20">
          <div className="space-y-8">
            {/* Red Squircle Logo Wrapper */}
            <div id="school_logo_box" className="flex items-center space-x-3">
              <div className="relative w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#1e3a8a] to-[#1e40af] shadow-md border border-blue-100 p-2 overflow-hidden">
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
                <span className="text-xs font-bold tracking-wider text-[#1e3a8a]/75 uppercase">Portal Access</span>
                {schoolBranding?.name ? (
                  <h2 className="text-sm font-bold text-slate-800 line-clamp-1">{schoolBranding.name}</h2>
                ) : (
                  <h2 className="text-sm font-bold text-slate-800">MyEduRide Gate</h2>
                )}
              </div>
            </div>

            {/* Greetings titles */}
            <div className="space-y-2">
              <h1 id="welcome_back_title" className="text-3xl font-extrabold tracking-tight text-slate-950">Welcome Back!</h1>
              <p id="welcome_back_subtitle" className="text-sm text-slate-500 leading-relaxed font-normal">{welcomeLine}</p>
            </div>

            {/* Inputs & Form Group */}
            <div className="space-y-4">
              {/* Username Input with Animated Floating Label */}
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  placeholder=" "
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="peer w-full px-4 pt-5 pb-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/45 text-slate-900 font-medium outline-none transition-all placeholder:opacity-0 focus:placeholder:opacity-100 min-h-[50px] bg-slate-50/50"
                  autoFocus
                  autoComplete="username"
                />
                <label
                  htmlFor="username"
                  className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none origin-[0] 
                             peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
                             peer-focus:scale-85 peer-focus:-translate-y-2.5 peer-focus:text-[#1e3a8a] 
                             scale-85 -translate-y-2.5 text-[#1e3a8a] font-semibold bg-white px-1.5"
                >
                  Username
                </label>
                {usernameHint ? (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-amber-600 mt-1.5 font-medium pl-1 flex items-center gap-1"
                  >
                    <span>⚠️</span> {usernameHint}
                  </motion.p>
                ) : (
                  <p className="text-[10px] text-slate-400 pl-1 mt-1">Enter your assigned username to fetch branding.</p>
                )}
              </div>

              {/* Password Input with Animated Floating Label */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="peer w-full pl-4 pr-12 pt-5 pb-2 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100/45 text-slate-900 font-medium outline-none transition-all placeholder:opacity-0 focus:placeholder:opacity-100 min-h-[50px] bg-slate-50/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1e3a8a] transition-colors focus:outline-none h-[44px] w-[44px] flex items-center justify-center z-10"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <label
                  htmlFor="password"
                  className="absolute left-4 top-3.5 text-slate-400 text-sm transition-all pointer-events-none origin-[0] 
                             peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 
                             peer-focus:scale-85 peer-focus:-translate-y-2.5 peer-focus:text-[#1e3a8a] 
                             scale-85 -translate-y-2.5 text-[#1e3a8a] font-semibold bg-white px-1.5"
                >
                  Password
                </label>
              </div>

              <div className="flex justify-end pt-1">
                <span className="text-xs text-slate-400 font-medium hover:text-[#1e3a8a] cursor-not-allowed select-none">
                  Forgot Password?
                </span>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200/60 text-red-700 text-xs font-semibold leading-relaxed"
                >
                  {error}
                </motion.div>
              )}

              {/* Main Login CTA button matching the brand visual safety colors */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading || !username.trim() || !password.trim() || !!usernameHint}
                className="w-full relative overflow-hidden py-4 px-4 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 active:scale-[0.98] shadow-lg shadow-[#1e3a8a]/20 text-center min-h-[50px] cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </div>

          {/* Footer inside the white card */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center space-y-2 text-center">
            <a 
              href="/auth/register-school" 
              className="text-sm font-bold text-[#1e3a8a] hover:text-blue-700 underline underline-offset-4 transition"
            >
              Register your school — instant setup
            </a>
            <p className="text-[11px] text-slate-400 font-medium">MyEduRide — Guarding Student Safety Protocols</p>
          </div>
        </div>

        {/* Right Side: Creative 3D Scene Redesigned based on MyEduRide safety themes */}
        <div id="login_illustration_pane" className="hidden md:col-span-7 relative overflow-hidden flex-col justify-between p-10 text-white">
          {/* Drifting Clouds behind */}
          <div className="absolute top-10 left-[10%] opacity-40 pointer-events-none animate-[drift_25s_infinite_ease-in-out]">
            <svg width="120" height="40" viewBox="0 0 120 40" fill="white">
              <path d="M 20 30 A 15 15 0 0 1 45 15 A 20 20 0 0 1 85 15 A 15 15 0 0 1 110 30 L 20 30" />
            </svg>
          </div>
          <div className="absolute top-36 right-[15%] opacity-30 pointer-events-none animate-[drift_35s_infinite_ease-in-out_5s]">
            <svg width="80" height="30" viewBox="0 0 80 30" fill="white">
              <path d="M 10 25 A 10 10 0 0 1 30 15 A 15 15 0 0 1 60 15 A 10 10 0 0 1 75 25 L 10 25" />
            </svg>
          </div>
          <div className="absolute bottom-24 left-[5%] opacity-20 pointer-events-none animate-[drift_30s_infinite_ease-in-out_2s]">
            <svg width="100" height="35" viewBox="0 0 100 35" fill="white">
              <path d="M 15 28 A 12 12 0 0 1 38 15 A 18 18 0 0 1 78 15 A 12 12 0 0 1 92 28 L 15 28" />
            </svg>
          </div>

          {/* Header slogan on brand panel */}
          <div id="school_slogan" className="relative z-10 space-y-2 mt-4 max-w-sm">
            <span className="px-3 py-1 text-[11px] font-extrabold tracking-widest text-[#FFF] bg-white/15 rounded-full uppercase">
              Secure Gate Protocols
            </span>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-white mt-1">
              Guarding Every Arrival & Dismissal.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              Real-time gate dispatch, parent-authorised pickup verifications, and instant notification loops keep students aligned and safe.
            </p>
          </div>

          {/* Center 3D Layout Composition matching the brand design system */}
          <div id="composition_3d" className="relative h-64 w-full flex items-center justify-center select-none scale-100 lg:scale-[1.1]">
            <div className="relative w-full h-full max-w-md">
              {/* Giant Royal Blue Maps Pin (Floating) */}
              <div className="absolute top-2 left-32 z-30 animate-[bob_5s_infinite_ease-in-out]">
                <svg width="100" height="120" viewBox="0 0 100 120" fill="none" style={{ filter: 'drop-shadow(0 15px 15px rgba(0,0,0,0.25))' }}>
                  <defs>
                    <radialGradient id="pin_grad" cx="50%" cy="40%" r="50%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="70%" stopColor="#1e3a8a" />
                      <stop offset="100%" stopColor="#172554" />
                    </radialGradient>
                    <radialGradient id="glow_grad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* Pin body */}
                  <path d="M50 110 C90 70 90 35 50 10 C10 35 10 70 50 110 Z" fill="url(#pin_grad)" />
                  {/* Inner ring highlight */}
                  <circle cx="50" cy="45" r="22" fill="#2563eb" />
                  <circle cx="50" cy="45" r="16" fill="white" />
                  <circle cx="50" cy="45" r="8" fill="#1e3a8a" />
                  {/* Pin top highlight shine */}
                  <ellipse cx="50" cy="22" rx="30" ry="10" fill="url(#glow_grad)" />
                </svg>
                {/* Floating Shadow beneath the pin */}
                <div className="absolute bottom-[-15px] left-8 w-14 h-3 bg-black/25 rounded-full blur-md animate-[shadowScale_5s_infinite_ease-in-out]" />
              </div>

              {/* Books Stack (3D CSS skewed perspective representing registers) */}
              <div className="absolute bottom-1 right-20 z-20 flex flex-col space-y-[-14px]">
                {/* Book 1 (Golden Yellow) */}
                <div className="w-40 h-8 bg-amber-400 rounded-lg shadow-md border-b-4 border-amber-600 relative transform skew-x-[-12deg] rotate-[2deg] flex items-center justify-between px-3">
                  <div className="w-2 h-full bg-amber-500 absolute left-0 rounded-l" />
                  <div className="w-1.5 h-full bg-white absolute right-2" />
                  <span className="text-[10px] font-extrabold text-amber-900 tracking-wider ml-2 select-none">REGISTER</span>
                </div>
                {/* Book 2 (Pastel Green) */}
                <div className="w-44 h-8 bg-teal-500 rounded-lg shadow-md border-b-4 border-teal-700 relative transform skew-x-[-8deg] rotate-[-1deg] flex items-center justify-between px-3">
                  <div className="w-2 h-full bg-teal-600 absolute left-0 rounded-l" />
                  <div className="w-1.5 h-full bg-white absolute right-3" />
                  <span className="text-[10px] font-extrabold text-teal-100 tracking-wider ml-2 select-none">ATTENDANCE</span>
                </div>
                {/* Book 3 (Deep Corporate Blue) */}
                <div className="w-48 h-8 bg-[#1e3a8a] rounded-lg shadow-lg border-b-4 border-[#172554] relative transform skew-x-[-15deg] rotate-[1deg] flex items-center justify-between px-3">
                  <div className="w-2.5 h-full bg-[#172554] absolute left-0 rounded-l" />
                  <div className="w-1.5 h-full bg-white absolute right-4" />
                  <span className="text-[10px] font-extrabold text-blue-100 tracking-wider ml-4 select-none">SAFETY LOGS</span>
                </div>
              </div>

              {/* Laptop Model (Modern minimal vector model matching image) */}
              <div className="absolute bottom-6 left-10 z-20 transform -rotate-[3deg]">
                <div className="relative w-44 h-28 bg-[#3b82f6] rounded-t-xl border-t border-x border-white/40 p-1.5 flex flex-col justify-between shadow-2xl">
                  {/* Laptop Screen with friendly design */}
                  <div className="w-full h-full bg-[#FFF] rounded-lg overflow-hidden flex flex-col items-center justify-center p-2 relative">
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black text-[#1e3a8a] uppercase tracking-widest">MyEduRide</span>
                    {/* SVG mini gate visualization inside the laptop */}
                    <svg className="w-10 h-10 mt-1 opacity-90" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="6" width="20" height="12" rx="2" fill="#eff6ff" />
                      <circle cx="12" cy="12" r="3" fill="#1e3a8a" />
                      <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="1.5" />
                    </svg>
                  </div>
                  {/* Screen Base Hinges */}
                  <div className="w-full h-1 bg-[#1d4ed8] absolute bottom-0 left-0" />
                </div>
                {/* Laptop Keyboard Bed & Base Panel */}
                <div className="w-48 h-3.5 bg-[#1d4ed8] rounded-b-xl border-b-4 border-blue-950/40 relative left-[-8px] flex justify-center">
                  <div className="w-12 h-1 bg-blue-900/40 rounded-full mt-1" />
                </div>
              </div>

              {/* Striped Beach Ball with reflections (SVG vector drawn) */}
              <div className="absolute bottom-2 left-60 z-35 animate-[rollBounce_7s_infinite_ease-in-out]">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <defs>
                    <radialGradient id="ball_shine" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                      <stop offset="40%" stopColor="#fff" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* Background Circle */}
                  <circle cx="20" cy="20" r="18" fill="white" stroke="#bfdbfe" strokeWidth="1" />
                  {/* Left Blue stripe */}
                  <path d="M 20 2 C 10 10 10 30 20 38 C 2 30 2 10 2 2 Z" fill="#1e3a8a" />
                  {/* Right Gold stripe */}
                  <path d="M 20 2 C 30 10 30 30 20 38 C 38 30 38 10 38 2 Z" fill="#f59e0b" />
                  {/* Center circle ring */}
                  <circle cx="20" cy="20" r="5" fill="#fbbf24" />
                  {/* Highlight glossy overlay */}
                  <circle cx="20" cy="20" r="18" fill="url(#ball_shine)" />
                </svg>
              </div>
            </div>
          </div>

          {/* Slogan and details bottom */}
          <div className="flex items-center justify-between text-xs text-white/70 border-t border-white/10 pt-6 mt-4 relative z-10">
            <span>Powered by secure school-parent matching protocols</span>
            <span>v2.4.0 WAT</span>
          </div>
        </div>
      </motion.div>

      {/* Styled custom CSS animation animations for illustrations layout */}
      <style jsx global>{`
        @keyframes drift {
          0%, 100% { transform: translateX(0px); }
          50% { transform: translateX(18px); }
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-12px) scale(1.02); }
        }
        @keyframes shadowScale {
          0%, 100% { transform: scale(1); opacity: 0.25; }
          50% { transform: scale(0.85); opacity: 0.15; }
        }
        @keyframes rollBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(180deg); }
        }
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
