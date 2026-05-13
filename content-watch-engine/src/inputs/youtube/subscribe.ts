import cron from 'node-cron';
import { config } from '../../config';
import { logSubscription } from '../../db';

const sources: Array<{ inputPlugin: string; id: string; name: string }> =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('../../../sources.json');

const HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';

export async function subscribeChannel(sourceId: string): Promise<void> {
  const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${sourceId}`;
  const callback = `${config.webhookPublicUrl}/webhook/youtube`;

  const body = new URLSearchParams({
    'hub.callback': callback,
    'hub.topic': topic,
    'hub.verify': 'async',
    'hub.mode': 'subscribe',
    'hub.secret': config.webhookSecret,
    'hub.lease_seconds': '864000',
  });

  try {
    const res = await fetch(HUB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (res.ok || res.status === 202) {
      console.log(`[youtube] Subscribed to channel: ${sourceId}`);
      await logSubscription('youtube', sourceId, 'subscribed', `HTTP ${res.status}`);
    } else {
      const text = await res.text();
      console.warn(`[youtube] Subscription failed for ${sourceId}: ${res.status} ${text}`);
      await logSubscription('youtube', sourceId, 'failed', `HTTP ${res.status}: ${text}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[youtube] Subscription error for ${sourceId}:`, msg);
    await logSubscription('youtube', sourceId, 'failed', msg);
  }
}

export async function subscribeAll(): Promise<void> {
  const youtubeSources = sources.filter(s => s.inputPlugin === 'youtube');
  for (const source of youtubeSources) {
    await subscribeChannel(source.id);
  }
}

export function startSubscriptionCron(): void {
  // Approximates every 8 days (lease is 10 days)
  cron.schedule('0 3 1,9,17,25 * *', async () => {
    console.log('[youtube] Re-subscribing all channels (cron)');
    await subscribeAll();
  });
}
