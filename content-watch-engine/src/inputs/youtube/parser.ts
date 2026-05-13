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

async function getVideoDescription(videoId: string): Promise<string> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${config.youtubeApiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[youtube/parser] videos.list HTTP ${res.status} for ${videoId}`);
      return '';
    }
    const data = await res.json() as { items?: Array<{ snippet?: { description?: string } }> };
    return data.items?.[0]?.snippet?.description ?? '';
  } catch (err) {
    console.warn(`[youtube/parser] Failed to fetch description for ${videoId}:`, err);
    return '';
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

    const description = await getVideoDescription(videoId);

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
