import { SupabaseClient } from '@supabase/supabase-js';

export async function deleteStoragePhoto(supabase: SupabaseClient, photoUrl: string | null | undefined): Promise<boolean> {
  if (!photoUrl) return true;
  
  try {
    if (!photoUrl.includes('/storage/v1/object/public/')) {
      return false;
    }

    const segments = photoUrl.split('/storage/v1/object/public/');
    if (segments.length < 2) return false;

    const resourcePath = segments[1];
    const slashIdx = resourcePath.indexOf('/');
    if (slashIdx === -1) return false;

    const bucketName = resourcePath.substring(0, slashIdx);
    const filePath = resourcePath.substring(slashIdx + 1);

    if (!bucketName || !filePath) return false;

    console.log(`[deleteStoragePhoto] Attempting to delete from bucket="${bucketName}" path="${filePath}"`);
    const { error } = await supabase.storage.from(bucketName).remove([filePath]);
    if (error) {
      console.warn('[deleteStoragePhoto] Error removing storage object:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[deleteStoragePhoto] Exception removing storage object:', err);
    return false;
  }
}
