'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Navigation, ShieldCheck } from 'lucide-react';

const PHILOSOPHY_LINES = [
  'Pillar I: Parent Ownership and Real-Time Oversight...',
  'Pillar II: Transitioning transit safely to the Child’s World...',
  'Pillar III: Fully tracked, verified, and optimized journeys...',
  'Engaging MyEduRide Central Policy Engine checks...',
  'Securing campus gate RFID & biometric telemetry...',
  'Synchronizing digital guardianship authorization feeds...',
  'MyEduRide Gateways live. Welcome aboard!'
];

export default function MyEduRideLoader({ onComplete }: { onComplete?: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Cycle safety lines
    const lineInterval = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % PHILOSOPHY_LINES.length);
    }, 1400);

    // Dynamic fake loading progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          if (onComplete) {
            setTimeout(onComplete, 300);
          }
          return 100;
        }
        // Drifts upwards at various speeds
        const increment = prev < 30 ? 6 : prev < 70 ? 4 : prev < 90 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 80);

    return () => {
      clearInterval(lineInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 min-h-screen w-full flex flex-col items-center justify-center bg-[#070b19] text-white z-50 overflow-hidden font-sans select-none">
      {/* Absolute ambient lights */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1731] via-[#070b19] to-[#03060c]">
        {/* Soft glowing concentric custom rings */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[300px] h-[300px] rounded-full border border-blue-500/20 animate-ping duration-2000" />
          <div className="absolute w-[450px] h-[450px] rounded-full border border-blue-500/10 animate-pulse duration-3000" />
        </div>
        {/* Floating brand safety lines background decor */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8 text-center space-y-8">
        {/* Floating Brand Badge Assembly */}
        <div className="relative">
          {/* Safety Glow Halo ring */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#1e40af] via-[#f59e0b]/30 to-[#1e3a8a] rounded-full blur-xl opacity-60 animate-pulse" />
          
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#1e3a8a] to-[#1e40af] border border-white/10 flex items-center justify-center shadow-2xl p-4">
            <motion.div
              animate={{ transform: ['rotate(0deg)', 'rotate(360deg)'] }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="absolute inset-0.5 rounded-2xl border border-dashed border-[#f59e0b]/60 opacity-60"
            />
            <div className="relative flex flex-col items-center justify-center">
              <Shield className="w-10 h-10 text-[#f59e0b] animate-pulse" />
              <Navigation className="w-5 h-5 text-white absolute -bottom-1 right-[-4px] rotate-45" />
            </div>
          </div>

          {/* Little floating stars */}
          <Sparkles className="absolute -top-1 -right-1 text-amber-400 w-5 h-5 animate-bounce" />
          <ShieldCheck className="absolute -bottom-2 -left-2 text-emerald-400 w-6 h-6 animate-pulse" />
        </div>

        {/* Brand Names */}
        <div className="space-y-1.5">
          <h2 className="text-sm font-black tracking-[0.2em] text-[#f59e0b] uppercase">MYEDURIDE</h2>
          <p className="text-xl font-bold tracking-tight text-white/95">The Digital Guardian for Student Transport</p>
          <p className="text-xs text-slate-400">Personal Guardianship for Every School Journey</p>
        </div>

        {/* Progress Display Tube style (Modern & Industrial) */}
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold tracking-wider uppercase pl-0.5">
            <span>System Checklist</span>
            <span className="text-[#f59e0b]">{progress}% SECURED</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#f59e0b] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Philosophy statements / Live actions cycling with smooth transition */}
        <div className="h-14 flex items-center justify-center relative w-full px-4">
          <AnimatePresence mode="wait">
            <motion.p
              key={lineIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xs sm:text-sm font-medium text-slate-300 italic leading-relaxed"
            >
              {PHILOSOPHY_LINES[lineIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="pt-4 border-t border-slate-800/50 w-full">
          <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
            Central Policy Engine v4.8.2 • Secure Sockets Online
          </p>
        </div>
      </div>
    </div>
  );
}
