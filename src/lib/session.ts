import { NextRequest } from 'next/server';

export interface SessionUserRole {
  role: string;
  school_id: string;
}

export interface SessionData {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  roles: SessionUserRole[];
  primary_school?: {
    id: string;
    name: string;
    logo_url?: string | null;
    welcome_message?: string | null;
  } | null;
}

export function getSessionFromRequest(request: NextRequest): SessionData | null {
  try {
    // 1. Try x-myeduride-session header first (crucial for iframe-based sandbox environments where cookies are blocked)
    const headerValue = request.headers.get('x-myeduride-session');
    if (headerValue) {
      try {
        return JSON.parse(decodeURIComponent(headerValue));
      } catch {
        try {
          return JSON.parse(headerValue);
        } catch (err) {
          console.error('[session] Failed to parse x-myeduride-session header:', err);
        }
      }
    }

    const cookie = request.cookies.get('myeduride_session');
    if (!cookie?.value) return null;
    
    let value = cookie.value;
    
    // Strip surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    // Decode and parse the cookie value
    try {
      return JSON.parse(decodeURIComponent(value));
    } catch {
      try {
        return JSON.parse(value);
      } catch (parseErr) {
        console.error('[session] Failed to parse session cookie raw and decoded:', parseErr);
        return null;
      }
    }
  } catch (e) {
    console.error('[session] Failed to parse session cookie from request:', e);
    return null;
  }
}

export function sessionHasRole(session: SessionData | null, allowedRoles: string[]): boolean {
  if (!session || !session.roles) return false;
  return session.roles.some((r) => allowedRoles.includes(r.role));
}
