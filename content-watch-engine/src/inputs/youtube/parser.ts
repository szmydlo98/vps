import { parseStringPromise } from 'xml2js';
import { ContentItem } from '../../types';
import { config } from '../../config';

interface Source {
  inputPlugin: string;
  id: string;
  name: string;
  hint: string;
  alwaysSave: boolean;
  output: string;
}

const sources: Source[] =
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('../../../sources.json');

interface VideoSnippet {
  description: string;
  liveBroadcastContent: 'live' | 'upcoming' | 'none';
}

async function isShort(videoId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${videoId}`, { redirect: 'manual' });
    // Shorts return 200; regular videos redirect away from /shorts/
    return res.status === 200;
  } catch {
    return false;
  }
}

async function getVideoSnippet(videoId: string): Promise<VideoSnippet> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${config.youtubeApiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[youtube/parser] videos.list HTTP ${res.status} for ${videoId}`);
      return { description: '', liveBroadcastContent: 'none' };
    }
    const data = await res.json() as {
      items?: Array<{
        snippet?: { description?: string; liveBroadcastContent?: string };
        contentDetails?: { duration?: string };
      }>
    };
    const item = data.items?.[0];
    return {
      description: item?.snippet?.description ?? '',
      liveBroadcastContent: (item?.snippet?.liveBroadcastContent ?? 'none') as VideoSnippet['liveBroadcastContent'],
    };
  } catch (err) {
    console.warn(`[youtube/parser] Failed to fetch snippet for ${videoId}:`, err);
    return { description: '', liveBroadcastContent: 'none' };
  }
}

export async function parseAtom(xml: string): Promise<ContentItem | null> {
  let parsed: any;
  try {
    parsed = await parseStringPromise(xml, { explicitArray: true });
  } catch (err) {
    console.warn('[youtube/parser] XML parse error:', err);
    return null;
  }

  try {
    const entry = parsed?.feed?.entry?.[0] ?? parsed?.entry;
    if (!entry) {
      console.warn('[youtube/parser] No entry in Atom payload');
      return null;
    }

    const videoId: string = entry['yt:videoId']?.[0] ?? entry['yt:videoid']?.[0];
    const channelId: string = entry['yt:channelId']?.[0] ?? entry['yt:channelid']?.[0];
    const title: string = entry.title?.[0];

    if (!videoId || !channelId || !title) {
      console.warn('[youtube/parser] Missing videoId/channelId/title in entry');
      return null;
    }

    const source = sources.find(
      s => s.inputPlugin === 'youtube' && s.id === channelId
    );
    if (!source) {
      console.warn(`[youtube/parser] Unknown channel: ${channelId}`);
      return null;
    }

    const [{ description, liveBroadcastContent }, short] = await Promise.all([
      getVideoSnippet(videoId),
      isShort(videoId),
    ]);

    if (liveBroadcastContent === 'live' || liveBroadcastContent === 'upcoming') {
      console.log(`[youtube/parser] Skipping stream/premiere: ${title}`);
      return null;
    }

    if (short) {
      console.log(`[youtube/parser] Skipping short: ${title}`);
      return null;
    }

    return {
      id: `yt:${videoId}`,
      title,
      description,
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      sourceName: source.name,
      hint: source.hint,
      alwaysSave: source.alwaysSave,
      output: source.output,
      metadata: { videoId, channelId, inputPlugin: 'youtube' },
    };
  } catch (err) {
    console.warn('[youtube/parser] Failed to extract fields from Atom:', err);
    return null;
  }
}
