"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAtom = parseAtom;
const xml2js_1 = require("xml2js");
const config_1 = require("../../config");
const sources = 
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../../../sources.json');
async function getVideoSnippet(videoId) {
    try {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${config_1.config.youtubeApiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`[youtube/parser] videos.list HTTP ${res.status} for ${videoId}`);
            return { description: '', liveBroadcastContent: 'none' };
        }
        const data = await res.json();
        const snippet = data.items?.[0]?.snippet;
        return {
            description: snippet?.description ?? '',
            liveBroadcastContent: (snippet?.liveBroadcastContent ?? 'none'),
        };
    }
    catch (err) {
        console.warn(`[youtube/parser] Failed to fetch snippet for ${videoId}:`, err);
        return { description: '', liveBroadcastContent: 'none' };
    }
}
async function parseAtom(xml) {
    let parsed;
    try {
        parsed = await (0, xml2js_1.parseStringPromise)(xml, { explicitArray: true });
    }
    catch (err) {
        console.warn('[youtube/parser] XML parse error:', err);
        return null;
    }
    try {
        const entry = parsed?.feed?.entry?.[0] ?? parsed?.entry;
        if (!entry) {
            console.warn('[youtube/parser] No entry in Atom payload');
            return null;
        }
        const videoId = entry['yt:videoId']?.[0] ?? entry['yt:videoid']?.[0];
        const channelId = entry['yt:channelId']?.[0] ?? entry['yt:channelid']?.[0];
        const title = entry.title?.[0];
        if (!videoId || !channelId || !title) {
            console.warn('[youtube/parser] Missing videoId/channelId/title in entry');
            return null;
        }
        const source = sources.find(s => s.inputPlugin === 'youtube' && s.id === channelId);
        if (!source) {
            console.warn(`[youtube/parser] Unknown channel: ${channelId}`);
            return null;
        }
        const { description, liveBroadcastContent } = await getVideoSnippet(videoId);
        if (liveBroadcastContent === 'live' || liveBroadcastContent === 'upcoming') {
            console.log(`[youtube/parser] Skipping stream/premiere: ${title}`);
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
    }
    catch (err) {
        console.warn('[youtube/parser] Failed to extract fields from Atom:', err);
        return null;
    }
}
