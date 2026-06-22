import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { getSessionFromRequest } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session?.user_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, full_name, email, title, photo_base64, target_user_id } = await request.json();
    let targetUserId = session.user_id;

    // Check if school admin is updating another user
    if (target_user_id && target_user_id !== session.user_id) {
      const schoolIds = Array.from(
        new Set(
          (session.roles || [])
            .filter((r: any) => r.role === 'school_admin')
            .map((r: any) => r.school_id)
            .filter(Boolean)
        )
      );
      if (schoolIds.length === 0) {
        return NextResponse.json({ error: 'School admin access is required to modify other profiles' }, { status: 403 });
      }
      targetUserId = target_user_id;
    }

    if (!isSupabaseConfigured()) {
      // Sandbox Mode: Simulate saving details in response
      const updatedUser = {
        id: targetUserId,
        username: username || session.username,
        full_name: full_name || session.full_name,
        email: email || session.email,
        title: title || 'Parent',
        photo_url: photo_base64 ? 'data:image/png;base64,mock_photo_url' : (session.photo_url || null),
      };

      return NextResponse.json({
        success: true,
        profile: updatedUser,
        message: 'Sandbox: Profiles updated successfully in memory.'
      });
    }

    const supabase = getAdminClient();
    const updates: Record<string, any> = {};

    // 1. Username validations (if changed)
    if (username !== undefined) {
      const cleanUsername = username.toLowerCase().trim();
      if (cleanUsername) {
        if (cleanUsername.length < 3 || cleanUsername.length > 32) {
          return NextResponse.json({ error: 'Username must be between 3 and 32 characters' }, { status: 400 });
        }

        const { data: existing } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', targetUserId)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
        }
        updates.username = cleanUsername;
      }
    }

    // 2. Profile identity validations
    if (full_name !== undefined && full_name !== null) {
      if (!full_name.trim()) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 });
      }
      updates.full_name = full_name.trim();
    }

    if (email !== undefined && email !== null) {
      updates.email = email.trim();
    }

    // 3. Photo upload to private storage bucket 'photos'
    let finalPhotoUrl = null;
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
        const filePath = `profiles/${targetUserId}.${ext}`;

        // Upload/overwrite files in 'photos' bucket
        const { error: uploadErr } = await supabase.storage
          .from('photos')
          .upload(filePath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadErr) {
          console.error('[POST users/update] Photo upload failed:', uploadErr.message);
          return NextResponse.json({ error: `Photo upload failed: ${uploadErr.message}` }, { status: 500 });
        }

        finalPhotoUrl = `/api/photo?path=${encodeURIComponent(filePath)}`;
        updates.photo_url = finalPhotoUrl;
      } catch (uploadException: any) {
        console.error('[POST users/update] Photo upload exception:', uploadException);
        return NextResponse.json({ error: 'Error processing photo file stream.' }, { status: 500 });
      }
    }

    // 4. Update Database Table 'user_profiles' (making sure we don't accidentally send unmapped columns)
    const dbParams: Record<string, any> = {};
    if (updates.username !== undefined) dbParams.username = updates.username;
    if (updates.full_name !== undefined) dbParams.full_name = updates.full_name;
    if (updates.email !== undefined) dbParams.email = updates.email;

    const { error: updateErr } = await supabase
      .from('user_profiles')
      .update(dbParams)
      .eq('id', targetUserId)
      .select('id');

    if (updateErr) {
      console.error('[POST users/update] DB primary update failed:', updateErr.message);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Also update any photo_url if exists
    if (updates.photo_url) {
      await supabase
        .from('user_profiles')
        .update({ photo_url: updates.photo_url })
        .eq('id', targetUserId)
        .select('id')
        .catch(() => {});
    }

    // 5. Hard synchronization with standard Supabase Auth user database to update email/username/metadata
    const metaUpdates: Record<string, any> = {};
    if (full_name !== undefined && full_name !== null) metaUpdates.full_name = full_name.trim();
    if (title !== undefined && title !== null) metaUpdates.title = title.trim();
    if (finalPhotoUrl) metaUpdates.photo_url = finalPhotoUrl;

    const authUpdates: Record<string, any> = {
      user_metadata: metaUpdates
    };
    if (email !== undefined && email !== null) {
      authUpdates.email = email.trim();
      authUpdates.email_confirm = true; // Auto-confirm email update
    }

    const { error: authErr } = await supabase.auth.admin.updateUserById(targetUserId, authUpdates);

    if (authErr) {
      console.error('[POST users/update] Auth user metadata sync failed:', authErr.message);
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...updates,
        photo_url: finalPhotoUrl || updates.photo_url || null,
        title: title || updates.title || null
      },
      db_status: 'synced'
    });
  } catch (err: any) {
    console.error('[POST users/update] General Exception:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update user profiles.' }, { status: 500 });
  }
}
