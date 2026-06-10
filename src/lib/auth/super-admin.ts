import { normalizeUsername } from './username';

export function isSuperAdminUsername(username: string): boolean {
  const norm = normalizeUsername(username);
  return norm === 'superadmin' || norm === 'super_admin';
}

export function getPlatformSchoolId(): string {
  return process.env.PLATFORM_SCHOOL_ID || '00000000-0000-0000-0000-000000000000';
}

