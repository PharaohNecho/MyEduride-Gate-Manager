'use client';

import { useEffect, useState } from 'react';
import { getSession } from '@/lib/api';
import { KeyRound, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function AccountSettingsCard({ onSuccess }: { onSuccess?: () => void }) {
  const [session, setSession] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError('New password is required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

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

      setSuccessMsg('Password updated successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error occurred. Password changes may require database setup.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) return <div className="animate-pulse">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Account Settings</h3>
        <p className="text-xs text-gray-500 mt-1">Manage your profile credentials and security password.</p>
      </div>

      <div className="p-4 bg-gray-50 rounded-xl border space-y-3">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400 font-medium">Full Name</span>
          <span className="text-gray-800 font-semibold">{session.full_name}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400 font-medium">Username</span>
          <span className="text-gray-800 font-semibold font-mono">{session.username}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400 font-medium">Email</span>
          <span className="text-gray-800 font-semibold">{session.email || 'N/A'}</span>
        </div>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Type new password"
            className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full px-4 py-3 border rounded-xl text-sm outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 border border-red-100">
            <ShieldAlert size={16} className="text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-100">
            <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 text-xs bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition duration-150 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
          >
            <KeyRound size={14} />
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
