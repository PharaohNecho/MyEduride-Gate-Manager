'use client';

import { useEffect, useState } from 'react';
import { getSession, updateSession } from '@/lib/api';
import { StudentAvatar } from '@/components/shared/StudentAvatar';
import { KeyRound, ShieldAlert, CheckCircle2, User, Sparkles } from 'lucide-react';

export function AccountSettingsCard({ onSuccess }: { onSuccess?: () => void }) {
  const [session, setSession] = useState<any>(null);
  
  // Profile settings states
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccessMsg, setPwdSuccessMsg] = useState('');

  useEffect(() => {
    const activeSession = getSession();
    if (activeSession) {
      setSession(activeSession);
      setFullName(activeSession.full_name || '');
      setTitle(activeSession.title || '');
      setPhotoUrl(activeSession.photo_url || null);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileError('Full name is required');
      return;
    }

    setProfileLoading(true);
    setProfileError('');
    setProfileSuccessMsg('');

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
          full_name: fullName,
          title: title,
          photo_base64: photoBase64,
          email: session?.email,
          username: session?.username,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile details');
      }

      setProfileSuccessMsg('Profile details synced successfully!');
      
      const updated = updateSession({
        full_name: fullName,
        title: title,
        photo_url: data.profile?.photo_url || photoUrl,
      });

      if (updated) {
        setSession(updated);
        setPhotoUrl(updated.photo_url || null);
        setPhotoBase64(null);
      }
      
      setTimeout(() => {
        setProfileSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Error occurred updating profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPwdError('New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }

    setPwdLoading(true);
    setPwdError('');
    setPwdSuccessMsg('');

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
          password: newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPwdSuccessMsg('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setPwdError(err.message || 'Error occurred updating security password.');
    } finally {
      setPwdLoading(false);
    }
  };

  if (!session) return <div className="animate-pulse text-xs text-slate-500">Loading settings...</div>;

  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight font-sans">Account Profile Settings</h3>
        <p className="text-xs text-gray-500 mt-1">Manage your identity moniker, official title, and profile picture avatar.</p>
      </div>

      {/* SECTION 1: PROFILE DETAILS FORM */}
      <form onSubmit={handleUpdateProfile} className="space-y-4 border-b border-gray-100 pb-6">
        
        {/* Profile Avatar Live Selector */}
        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
          <div className="relative shrink-0">
            <StudentAvatar photoUrl={photoBase64 || photoUrl} firstName={fullName} size={54} />
            {photoBase64 && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white font-extrabold text-[8px] uppercase px-1 py-0.5 rounded-full border border-white">
                Pending
              </span>
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-gray-800">Identify Avatar Logo</h4>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-2 py-1 rounded text-[10px] font-bold transition">
                <span>Choose Photo</span>
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
                  className="text-red-500 hover:text-red-600 text-[10px] font-bold"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 min-h-[40px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Official Title / Role</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Principal, Guard, Mother"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 min-h-[40px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Portal Username</label>
            <input
              type="text"
              readOnly
              value={session.username}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs outline-none min-h-[40px] cursor-not-allowed font-mono text-gray-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="text"
              readOnly
              value={session.email || 'N/A'}
              className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs outline-none min-h-[40px] cursor-not-allowed text-gray-500"
            />
          </div>
        </div>

        {profileError && (
          <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100 font-sans">
            <ShieldAlert size={14} className="text-red-500 shrink-0" />
            <span>{profileError}</span>
          </div>
        )}

        {profileSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-150 font-sans">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>{profileSuccessMsg}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={profileLoading}
            className="px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition disabled:opacity-50 inline-flex items-center gap-1 min-h-[40px] cursor-pointer"
          >
            <span>{profileLoading ? 'Saving Info...' : 'Save Profile Details'}</span>
          </button>
        </div>
      </form>

      {/* SECTION 2: PASSWORD CHANGE */}
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Change Passcode Credentials</h4>
          <p className="text-[10px] text-gray-400 mt-0.5">Keep your account secure by rotating gateway secrets regularly.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Type new passcode"
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 min-h-[40px]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type passcode"
              className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 min-h-[40px]"
            />
          </div>
        </div>

        {pwdError && (
          <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100 font-sans">
            <ShieldAlert size={14} className="text-red-500 shrink-0" />
            <span>{pwdError}</span>
          </div>
        )}

        {pwdSuccessMsg && (
          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2 border border-emerald-150 font-sans">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span>{pwdSuccessMsg}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pwdLoading}
            className="px-4 py-2 text-xs bg-gray-950 hover:bg-gray-900 text-white rounded-xl font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5 min-h-[40px] cursor-pointer shadow-xs"
          >
            <KeyRound size={12} />
            <span>{pwdLoading ? 'Saving...' : 'Update Passcode'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
