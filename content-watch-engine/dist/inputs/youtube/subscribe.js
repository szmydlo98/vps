"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeChannel = subscribeChannel;
exports.subscribeAll = subscribeAll;
exports.startSubscriptionCron = startSubscriptionCron;
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("../../config");
const db_1 = require("../../db");
const sources = 
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../../../sources.json');
const HUB_URL = 'https://pubsubhubbub.appspot.com/subscribe';
async function subscribeChannel(sourceId) {
    const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${sourceId}`;
    const callback = `${config_1.config.webhookPublicUrl}/webhook/youtube`;
    const body = new URLSearchParams({
        'hub.callback': callback,
        'hub.topic': topic,
        'hub.verify': 'async',
        'hub.mode': 'subscribe',
        'hub.secret': config_1.config.webhookSecret,
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
            await (0, db_1.logSubscription)('youtube', sourceId, 'subscribed', `HTTP ${res.status}`);
        }
        else {
            const text = await res.text();
            console.warn(`[youtube] Subscription failed for ${sourceId}: ${res.status} ${text}`);
            await (0, db_1.logSubscription)('youtube', sourceId, 'failed', `HTTP ${res.status}: ${text}`);
        }
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[youtube] Subscription error for ${sourceId}:`, msg);
        await (0, db_1.logSubscription)('youtube', sourceId, 'failed', msg);
    }
}
async function subscribeAll() {
    const youtubeSources = sources.filter(s => s.inputPlugin === 'youtube');
    for (const source of youtubeSources) {
        await subscribeChannel(source.id);
    }
}
function startSubscriptionCron() {
    // Approximates every 8 days (lease is 10 days)
    node_cron_1.default.schedule('0 3 1,9,17,25 * *', async () => {
        console.log('[youtube] Re-subscribing all channels (cron)');
        await subscribeAll();
    });
}
