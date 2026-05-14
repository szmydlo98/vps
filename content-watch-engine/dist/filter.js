"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterNewsletter = filterNewsletter;
exports.shouldSave = shouldSave;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("./config");
const client = new openai_1.default({
    apiKey: config_1.config.geminiApiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});
const NEWSLETTER_SYSTEM_PROMPT = `You are a newsletter filter. Given newsletter content (possibly HTML) and a user hint about their interests, identify all topic/article sections. For each topic decide if it matches the hint. Return ONLY a JSON array of relevant topics: [{"title": "topic title", "description": "2-3 sentence summary"}]. Return [] if nothing is relevant. No markdown, no code fences, no preamble.`;
async function filterNewsletter(content, hint) {
    try {
        const response = await client.chat.completions.create({
            model: 'gemini-2.5-flash',
            max_tokens: 4000,
            messages: [
                { role: 'system', content: NEWSLETTER_SYSTEM_PROMPT },
                { role: 'user', content: `Hint: ${hint}\n\nNewsletter content:\n${content.slice(0, 12000)}` },
            ],
        });
        const raw = response.choices[0].message.content ?? '';
        const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        return JSON.parse(text);
    }
    catch (err) {
        console.error('[filter] filterNewsletter error:', err);
        return [];
    }
}
const SYSTEM_PROMPT = `You are a content relevance filter. Given a content item's title, description, and a source-specific hint, decide if the item is worth saving.

The hint is a plain-English instruction written by the user for this specific source. Follow it strictly.

Return ONLY the single word: true or false. Nothing else. No JSON, no explanation.

Be conservative — only return true if the item clearly matches the hint.`;
async function callGeminiWithRetry(messages) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const response = await client.chat.completions.create({
                model: 'gemini-2.5-flash',
                max_tokens: 100,
                messages,
            });
            return (response.choices[0].message.content ?? '').trim().toLowerCase();
        }
        catch (err) {
            const isRateLimit = err instanceof Error && err.message.includes('429');
            if (isRateLimit && attempt < 3) {
                const delay = attempt * 60000;
                console.warn(`[filter] Rate limited, retrying in ${delay / 1000}s (attempt ${attempt}/3)`);
                await new Promise(r => setTimeout(r, delay));
            }
            else {
                throw err;
            }
        }
    }
    throw new Error('Unreachable');
}
async function shouldSave(item) {
    try {
        const userMessage = `Source hint: ${item.hint}
Title: ${item.title}
Description: ${item.description.slice(0, 800)}`;
        const text = await callGeminiWithRetry([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
        ]);
        const relevant = text.startsWith('true') ? 'true' : 'false';
        console.log(`[filter] "${item.title}" → ${relevant} | desc_len=${item.description.length} | ai_raw="${text}"`);
        return { relevant, reason: '' };
    }
    catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.error(`[filter] shouldSave error for "${item.title}":`, detail);
        return { relevant: 'error', reason: 'filter error', errorDetail: detail };
    }
}
