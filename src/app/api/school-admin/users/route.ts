import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ListedUser = {
  id: string;
  username: string;
  email: string;
  full_name: string;
  roles: string[];
  password: string;
};

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session?.user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const schoolIds = Array.from(
    new Set(
      (session.roles || [])
        .filter((r: any) => r.role === 'school_admin')
        .map((r: any) => r.school_id)
        .filter(Boolean)
    )
  );

  if (schoolIds.length === 0) {
    return NextResponse.json({ error: 'School admin access required' }, { status: 403 });
  }

  try {
    const supabase = getAdminClient();

    const { data: scopedRoles, error: scopedRolesErr } = await supabase
      .from('user_school_roles')
      .select('user_id, role')
      .in('school_id', schoolIds)
      .eq('is_active', true);

    if (scopedRolesErr) {
      return NextResponse.json({ error: scopedRolesErr.message }, { status: 500 });
    }

    const userIds = Array.from(new Set((scopedRoles || []).map((r: any) => r.user_id).filter(Boolean)));
    if (userIds.length === 0) {
      return NextResponse.json({ users: [] });
    }

    const roleMap = new Map<string, Set<string>>();
    for (const row of scopedRoles || []) {
      if (!roleMap.has(row.user_id)) roleMap.set(row.user_id, new Set<string>());
      roleMap.get(row.user_id)!.add(row.role);
    }

    const { data: profiles, error: profilesErr } = await supabase
      .from('user_profiles')
      .select('id, username, email, full_name')
      .in('id', userIds);

    if (profilesErr) {
      return NextResponse.json({ error: profilesErr.message }, { status: 500 });
    }

    const authById = new Map<string, { password: string }>();
    let page = 1;
    const perPage = 1000;
    while (page <= 20) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      for (const user of data.users) {
        if (!userIds.includes(user.id)) continue;
        authById.set(user.id, {
          password: (user.user_metadata?.login_password as string) || '',
        });
      }

      if (data.users.length < perPage) break;
      page += 1;
    }

    const users: ListedUser[] = (profiles || [])
      .map((p: any) => ({
        id: p.id,
        username: p.username || '',
        email: p.email || '',
        full_name: p.full_name || '',
        roles: Array.from(roleMap.get(p.id) || []),
        password: authById.get(p.id)?.password || '',
      }))
      .sort((a: any, b: any) => a.username.localeCompare(b.username));

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session?.user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, full_name, email, photo_base64 } = await request.json();
    const supabase = getAdminClient();

    const updates: Record<string, any> = {};

    // 1. Username handling with uniqueness validation
    if (username !== undefined) {
      const cleanUsername = username.toLowerCase().trim();
      if (!cleanUsername) {
        return NextResponse.json({ error: 'Username cannot be empty' }, { status: 400 });
      }
      if (cleanUsername.length < 3 || cleanUsername.length > 32) {
        return NextResponse.json({ error: 'Username must be between 3 and 32 characters' }, { status: 400 });
      }

      // Check for uniqueness if username changed
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', cleanUsername)
        .neq('id', session.user_id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }

      updates.username = cleanUsername;
    }

    // 2. Profile identity validations
    if (full_name !== undefined) {
      if (!full_name.trim()) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 });
      }
      updates.full_name = full_name.trim();
    }

    if (email !== undefined) {
      updates.email = email.trim();
    }

    // 3. Photo upload to private storage bucket
    if (photo_base64) {
      try {
        const matches = photo_base64.match(/^data:(image\/\w+);base64,(.+)$/);
        if (!matches) {
          return NextResponse.json({ error: 'Invalid profile photo data format' }, { status: 400 });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = mimeType.split('/')[1] || 'jpg';
        const filePath = `profiles/${session.user_id}.${ext}`;

        // Upload to private 'photos' bucket
        const { error: uploadErr } = await supabase.storage
          .from('photos')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadErr) {
          console.error('[POST school-admin/users] Photo upload failed:', uploadErr.message);
          return NextResponse.json({ error: `Photo upload failed: ${uploadErr.message}` }, { status: 500 });
        }

        // Store proxy retrieval URL as recommended by README
        updates.photo_url = `/api/photo?path=${encodeURIComponent(filePath)}`;
      } catch (uploadException: any) {
        console.error('[POST school-admin/users] Photo upload exceptions:', uploadException);
        return NextResponse.json({ error: 'Error processing photo file stream.' }, { status: 500 });
      }
    }

    // 4. Update Database
    const { error: updateErr } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', session.user_id)
      .select('id');

    if (updateErr) {
      // If photo_url column doesn't exist, try updating without photo_url and report fallback
      if (updateErr.message?.includes('column "photo_url" of relation "user_profiles" does not exist') || 
          updateErr.code === '42703') {
        
        // Remove photo_url and retry the remaining fields
        const { photo_url, ...partialUpdates } = updates;
        const { error: retryErr } = await supabase
          .from('user_profiles')
          .update(partialUpdates)
          .eq('id', session.user_id)
          .select('id');

        if (retryErr) {
          return NextResponse.json({ error: retryErr.message }, { status: 500 });
        }

        return NextResponse.json({ 
          success: true, 
          profile: partialUpdates,
          column_missing: true,
          error_note: 'Username & Identity details are synced! (However, profile photo could not be written to user_profiles table as the "photo_url" column is missing in your Supabase DB. Run "ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;" to enable photo saving)'
        });
      }

      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: updates });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to process identity update requests.' }, { status: 500 });
  }
}

