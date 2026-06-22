import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  let path = request.nextUrl.searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 });
  }

  // Robustly handle full photo proxy URL being passed instead of raw storage path
  if (path.includes('path=')) {
    try {
      const url = new URL(path, 'https://dummy.com');
      const innerPath = url.searchParams.get('path');
      if (innerPath) {
        path = innerPath;
      }
    } catch (e) {
      const match = path.match(/[?&]path=([^&]+)/);
      if (match && match[1]) {
        path = decodeURIComponent(match[1]);
      } else {
        const parts = path.split('path=');
        if (parts[1]) {
          path = decodeURIComponent(parts[1]);
        }
      }
    }
  }

  if (!isSupabaseConfigured()) {
    // Return empty inline transparent 1x1 image in sandbox mode
    const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    return new Response(buffer, {
      headers: { 'Content-Type': 'image/gif' },
    });
  }

  try {
    const supabase = getAdminClient();
    
    // Download file from 'photos' bucket
    const { data, error } = await supabase.storage.from('photos').download(path);
    if (error || !data) {
      const isNotFound = error?.message?.includes('Object not found') || (error as any)?.status === 404;
      if (!isNotFound) {
        console.warn(`[GET /api/photo] Storage download system error for path ${path}:`, error?.message);
      } else {
        console.log(`[GET /api/photo] Info: File not present at storage path ${path}`);
      }
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const contentType = data.type || 'image/jpeg';

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err: any) {
    console.error('[GET /api/photo] General exception:', err);
    return NextResponse.json({ error: err?.message || 'Error downloading photo' }, { status: 500 });
  }
}
