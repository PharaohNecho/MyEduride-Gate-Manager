import { SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';

let vapidConfigured = false;

function ensureVapidDetails() {
  if (vapidConfigured) return true;
  
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@myeduride.com';

  if (publicVapidKey && privateVapidKey) {
    try {
      webpush.setVapidDetails(
        vapidSubject,
        publicVapidKey,
        privateVapidKey
      );
      vapidConfigured = true;
      return true;
    } catch (err) {
      console.error('[sendPushToUser] setVapidDetails exception:', err);
    }
  }
  return false;
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    title: string;
    message: string;
    type?: string;
    student_id?: string;
    url?: string;
    tag?: string;
  }
): Promise<{ sent: number }> {
  try {
    const isReady = ensureVapidDetails();
    if (!isReady) {
      console.log('[sendPushToUser] Push notifications not fully configured (missing VAPID keys)');
      return { sent: 0 };
    }

    const { data: subs, error } = await supabase
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);

    if (error || !subs || subs.length === 0) {
      return { sent: 0 };
    }

    let sentCount = 0;
    const payloadStr = JSON.stringify(payload);

    for (const row of subs) {
      try {
        const subObj = typeof row.subscription === 'string' 
          ? JSON.parse(row.subscription) 
          : row.subscription;
          
        if (subObj && subObj.endpoint) {
          await webpush.sendNotification(subObj, payloadStr);
          sentCount++;
        }
      } catch (sendErr: any) {
        console.warn('[sendPushToUser] Failed to send push to subscription:', sendErr.message);
        if (sendErr.statusCode === 410 || sendErr.statusCode === 404) {
          const subTarget = typeof row.subscription === 'object' ? JSON.stringify(row.subscription) : row.subscription;
          await supabase
            .from('user_push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('subscription', subTarget);
        }
      }
    }

    return { sent: sentCount };
  } catch (err) {
    console.error('[sendPushToUser] Exception sending push to user:', err);
    return { sent: 0 };
  }
}
