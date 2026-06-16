'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { RoleSwitcher } from '@/components/shared/RoleSwitcher';
import { AccountSettingsCard } from '@/components/shared/AccountSettingsCard';
import { SessionIdleGuard } from '@/components/shared/SessionIdleGuard';
import { logout } from '@/lib/api';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { KeyRound, LogOut, X, Database, Info, HelpCircle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSchoolAdmin = pathname?.startsWith('/dashboard/school-admin');
  const isParent = pathname?.startsWith('/dashboard/parent');
  const [showAccount, setShowAccount] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
  }, []);

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      <SessionIdleGuard />
      
      {!configured && (
        <div id="sandbox-banner" className="bg-amber-500 text-white text-xs px-4 py-2.5 flex items-center justify-between font-sans gap-2 shadow-sm border-b border-amber-600 relative z-50">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-white text-amber-700 px-1.5 py-0.5 rounded text-[10px] tracking-wider uppercase shadow-xs">Sandbox</span>
            <span>Running with simulated demo data. Real database is unconfigured.</span>
          </div>
          <button 
            type="button"
            onClick={() => setShowSetupGuide(true)}
            className="underline hover:text-amber-100 font-semibold transition"
          >
            How to Connect
          </button>
        </div>
      )}

      {showSetupGuide && (
        <div id="setup-guide-modal" className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto border border-gray-100 font-sans">
            <button
              type="button"
              onClick={() => setShowSetupGuide(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2.5 bg-sky-50 rounded-xl text-sky-600">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Connect Your Supabase Project</h3>
                <p className="text-xs text-gray-500 mt-0.5">MyEduRide requires database variables to persist records.</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <p>The app is currently running in a robust mock sandbox so you can explore all dashboards and features. To connect actual Supabase, follow these instructions:</p>
              
              <div className="space-y-2 border-l-2 border-gray-100 pl-4 py-1">
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">1</div>
                  <p className="font-semibold text-gray-800 text-xs">Create a Supabase Project</p>
                  <p className="text-xs text-gray-500">Sign up or sign in to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">supabase.com</a> and create a new project.</p>
                </div>
                
                <div className="relative pt-2">
                  <div className="absolute -left-6 top-2.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">2</div>
                  <p className="font-semibold text-gray-800 text-xs">Get Project Credentials</p>
                  <p className="text-xs text-gray-500">Go to <strong>Project Settings</strong> &gt; <strong>API</strong>. Locate your URL, anon key, and service_role key.</p>
                </div>

                <div className="relative pt-2">
                  <div className="absolute -left-6 top-2.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">3</div>
                  <p className="font-semibold text-gray-800 text-xs">Configure in AI Studio</p>
                  <p className="text-xs text-gray-500">Click on the Cog/Settings icon in the bottom-left of Google AI Studio and configure these variables:</p>
                  <ul className="text-xs font-mono bg-gray-50 p-2.5 rounded-lg text-gray-700 space-y-1 mt-1.5 border border-gray-100">
                    <li>NEXT_PUBLIC_SUPABASE_URL</li>
                    <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                    <li>SUPABASE_SERVICE_ROLE_KEY</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 bg-sky-50/50 rounded-xl text-xs text-sky-800 flex gap-2 border border-sky-100">
                <Info size={16} className="text-sky-500 shrink-0 mt-0.5" />
                <p>After adding environment secrets, please restart the development server or refresh the browser to enable production credentials.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSetupGuide(false)}
                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition shadow-sm"
              >
                Close Connection Helper
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-3 right-3 z-30 flex items-center gap-1 bg-white/90 shadow-sm border border-slate-100 p-1 rounded-2xl">
        <RoleSwitcher showLogout={false} />
      </div>

      {showAccount && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAccount(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <AccountSettingsCard onSuccess={() => setShowAccount(false)} />
          </div>
        </div>
      )}

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

