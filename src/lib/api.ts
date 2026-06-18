export interface SessionUserRole {
  role: string;
  school_id: string;
}

export interface SessionData {
  user_id: string;
  username: string;
  email: string;
  full_name: string;
  photo_url?: string | null;
  title?: string | null;
  roles: SessionUserRole[];
  primary_school?: {
    id: string;
    name: string;
    logo_url?: string | null;
    welcome_message?: string | null;
  } | null;
}

export function getSession(): SessionData | null {
  if (typeof window === 'undefined') return null;
  try {
    // Try localStorage first as it is bulletproof inside iframe environments
    const localSession = localStorage.getItem('myeduride_session');
    if (localSession) {
      try {
        return JSON.parse(localSession);
      } catch (e) {
        console.error('[api] Failed to parse localStorage session:', e);
      }
    }

    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find((row) => row.trim().startsWith('myeduride_session='));
    if (!sessionCookie) return null;
    
    // Split on first '=' to separate name and value perfectly
    const parts = sessionCookie.trim().split('=');
    let value = parts.slice(1).join('=');
    if (!value) return null;
    
    // Strip surrounding quotes from value if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    try {
      const parsed = JSON.parse(decodeURIComponent(value));
      // Backfill localStorage if found in cookie but not in storage
      if (parsed && !localSession) {
        localStorage.setItem('myeduride_session', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      try {
        const parsed = JSON.parse(value);
        if (parsed && !localSession) {
          localStorage.setItem('myeduride_session', JSON.stringify(parsed));
        }
        return parsed;
      } catch (parseErr) {
        console.error('[api] JSON parsing failed both decoded and raw:', parseErr);
        return null;
      }
    }
  } catch (e) {
    console.error('[api] Error parsing client session cookie:', e);
    return null;
  }
}

export async function fetchData(action: string, params: Record<string, any> = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    const session = getSession();
    if (session) {
      headers['x-myeduride-session'] = encodeURIComponent(JSON.stringify(session));
    }
  }

  const response = await fetch('/api/data', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action, params }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    let err = 'Request failed';
    try {
      err = JSON.parse(text).error || err;
    } catch {}
    throw new Error(err);
  }
  
  return response.json();
}

export function logout() {
  if (typeof window === 'undefined') return;
  // Clear the session cookie and localStorage
  document.cookie = 'myeduride_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
  localStorage.removeItem('myeduride_session');
  window.location.href = '/auth/login';
}

export function updateSession(newData: Partial<SessionData>): SessionData | null {
  if (typeof window === 'undefined') return null;
  const current = getSession();
  if (!current) return null;
  const updated = { ...current, ...newData };
  const serialized = JSON.stringify(updated);
  localStorage.setItem('myeduride_session', serialized);
  // Set the cookie with a 1-day expiry
  document.cookie = `myeduride_session=${encodeURIComponent(serialized)}; path=/; max-age=86400; SameSite=Lax;`;
  return updated;
}
