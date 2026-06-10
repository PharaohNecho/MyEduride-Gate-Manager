'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/api';
import { Shield, GraduationCap, Users, DoorOpen, User } from 'lucide-react';

const ROLE_LABELS: Record<string, { label: string; icon: any; href: string }> = {
  super_admin: { label: 'Super Admin', icon: <Shield size={14} />, href: '/dashboard/super-admin' },
  school_admin: { label: 'School Admin', icon: <GraduationCap size={14} />, href: '/dashboard/school-admin' },
  teacher: { label: 'Teacher', icon: <Users size={14} />, href: '/dashboard/teacher' },
  gate_officer: { label: 'Gate Officer', icon: <DoorOpen size={14} />, href: '/dashboard/gate' },
  parent: { label: 'Parent', icon: <User size={14} />, href: '/dashboard/parent' },
  staff: { label: 'Staff', icon: <User size={14} />, href: '/dashboard/staff' },
};

export function RoleSwitcher({ showLogout = true }: { showLogout?: boolean }) {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState<string>('');

  useEffect(() => {
    const session = getSession();
    if (!session) return;
    const userRoles = [...new Set((session.roles || []).map((r: any) => r.role))];
    setRoles(userRoles);

    // Determine current role based on path
    const path = window.location.pathname;
    const matched = Object.entries(ROLE_LABELS).find(([_, config]) => path.startsWith(config.href));
    if (matched) {
      setCurrentRole(matched[0]);
    }
  }, []);

  if (roles.length <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full shadow-sm">
      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mr-1">Active:</span>
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => {
          const config = ROLE_LABELS[role];
          if (!config) return null;
          const isActive = currentRole === role;
          return (
            <button
              key={role}
              onClick={() => {
                setCurrentRole(role);
                router.push(config.href);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
              }`}
            >
              {config.icon}
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
