"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldSave = shouldSave;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("./config");
const client = new openai_1.default({
    apiKey: config_1.config.geminiApiKey,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});
const SYSTEM_PROMPT = `You are a content relevance filter. Given a content item's title, description, and a source-specific hint, decide if the item is worth saving.

The hint is a plain-English instruction written by the user for this specific source. Follow it strictly.

Return ONLY a valid JSON object with no markdown, no preamble:
{"relevant": true, "reason": "one sentence explanation"}

Be conservative — only mark relevant if the item clearly matches the hint.`;
async function shouldSave(item) {
    try {
        const userMessage = `Source hint: ${item.hint}
Title: ${item.title}
Description: ${item.description.slice(0, 800)}`;
        const response = await client.chat.completions.create({
            model: 'gemini-2.5-flash',
            max_tokens: 150,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ],
        });
        const text = response.choices[0].message.content ?? '';
        const parsed = JSON.parse(text);
        return {
            relevant: parsed.relevant ? 'true' : 'false',
            reason: parsed.reason ?? '',
        };
    }
    catch (err) {
        return {
            relevant: 'error',
            reason: 'filter error',
            errorDetail: err instanceof Error ? err.message : String(err),
        };
    }
}
