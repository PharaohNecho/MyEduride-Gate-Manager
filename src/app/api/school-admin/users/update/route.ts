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
    const { username, full_name, email, title, photo_base64 } = await request.json();
    const targetUserId = session.user_id;

    if (!isSupabaseConfigured()) {
      // Sandbox Mode: Simulate saving details in response
      const updatedUser = {
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
    if (username !== undefined && username.toLowerCase().trim() !== session.username?.toLowerCase()?.trim()) {
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
    if (full_name !== undefined) {
      if (!full_name.trim()) {
        return NextResponse.json({ error: 'Full name cannot be empty' }, { status: 400 });
      }
      updates.full_name = full_name.trim();
    }

    if (email !== undefined) {
      updates.email = email.trim();
    }

    if (title !== undefined) {
      updates.title = title.trim();
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

    // 4. Update Database Table 'user_profiles'
    let dbUpdateErrorType = null;
    const { error: updateErr } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', targetUserId);

    if (updateErr) {
      console.warn('[POST users/update] DB primary update failed, falling back:', updateErr.message);
      
      // Fallback: Remove non-existent columns (photo_url or title) and update remaining clean fields
      const { photo_url, title: titleVal, ...partialUpdates } = updates;
      const { error: retryErr } = await supabase
        .from('user_profiles')
        .update(partialUpdates)
        .eq('id', targetUserId);

      if (retryErr) {
        return NextResponse.json({ error: retryErr.message }, { status: 500 });
      }
      dbUpdateErrorType = 'partial_columns_missing';
    }

    // 5. Hard synchronization with standard Supabase Auth user metadata
    // This makes sure both the title, photo_url, and full_name are fully saved in auth JSON format
    const metaUpdates: Record<string, any> = {};
    if (full_name !== undefined) metaUpdates.full_name = full_name.trim();
    if (title !== undefined) metaUpdates.title = title.trim();
    if (finalPhotoUrl) metaUpdates.photo_url = finalPhotoUrl;

    const { error: authErr } = await supabase.auth.admin.updateUserById(targetUserId, {
      user_metadata: metaUpdates,
    });

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
      db_status: dbUpdateErrorType || 'synced'
    });
  } catch (err: any) {
    console.error('[POST users/update] General Exception:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update user profiles.' }, { status: 500 });
  }
}
