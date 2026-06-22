import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getSessionFromRequest, sessionHasRole } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session || !sessionHasRole(session, ['super_admin', 'school_admin'])) {
      return NextResponse.json({ error: 'Authorized portal access required' }, { status: 403 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        configured: false,
        photo_url_active: true,
        logo_url_active: true,
        primary_color_active: true,
        secondary_color_active: true,
        note: 'Supabase in local sandbox simulation mode'
      });
    }

    const supabase = getAdminClient();
    const status = {
      configured: true,
      photo_url_active: false,
      logo_url_active: false,
      primary_color_active: false,
      secondary_color_active: false,
      errors: [] as string[]
    };

    // 1. Probe user_profiles for photo_url
    try {
      const { error } = await supabase.from('user_profiles').select('photo_url').limit(1);
      if (error && (error.code === '42703' || error.message?.includes('column "photo_url" does not exist'))) {
        status.photo_url_active = false;
        status.errors.push('user_profiles: photo_url column missing');
      } else {
        status.photo_url_active = true;
      }
    } catch {
      status.photo_url_active = false;
    }

    // 2. Probe schools for logo_url
    try {
      const { error } = await supabase.from('schools').select('logo_url').limit(1);
      if (error && (error.code === '42703' || error.message?.includes('column "logo_url" does not exist'))) {
        status.logo_url_active = false;
        status.errors.push('schools: logo_url column missing');
      } else {
        status.logo_url_active = true;
      }
    } catch {
      status.logo_url_active = false;
    }

    // 3. Probe schools for primary_color & secondary_color
    try {
      const { error } = await supabase.from('schools').select('primary_color, secondary_color').limit(1);
      if (error && (error.code === '42703' || error.message?.includes('column "primary_color" does not exist'))) {
        status.primary_color_active = false;
        status.secondary_color_active = false;
        status.errors.push('schools: color theme columns missing');
      } else {
        status.primary_color_active = true;
        status.secondary_color_active = true;
      }
    } catch {
      status.primary_color_active = false;
      status.secondary_color_active = false;
    }

    return NextResponse.json(status);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Inspection failed' }, { status: 500 });
  }
}
