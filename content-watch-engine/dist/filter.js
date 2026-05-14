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
async function shouldSave(item) {
    try {
        const userMessage = `Source hint: ${item.hint}
Title: ${item.title}
Description: ${item.description.slice(0, 800)}`;
        const response = await client.chat.completions.create({
            model: 'gemini-2.5-flash',
            max_tokens: 10,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ],
        });
        const text = (response.choices[0].message.content ?? '').trim().toLowerCase();
        const relevant = text.startsWith('true') ? 'true' : 'false';
        return { relevant, reason: '' };
    }
    catch (err) {
        return {
            relevant: 'error',
            reason: 'filter error',
            errorDetail: err instanceof Error ? err.message : String(err),
        };
    }
}
