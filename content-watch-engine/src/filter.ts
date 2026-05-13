import OpenAI from 'openai';
import { config } from './config';
import { ContentItem, FilterResult } from './types';

const client = new OpenAI({
  apiKey: config.geminiApiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

const SYSTEM_PROMPT = `You are a content relevance filter. Given a content item's title, description, and a source-specific hint, decide if the item is worth saving.

The hint is a plain-English instruction written by the user for this specific source. Follow it strictly.

Return ONLY the single word: true or false. Nothing else. No JSON, no explanation.

Be conservative — only return true if the item clearly matches the hint.`;

export async function shouldSave(item: ContentItem): Promise<FilterResult> {
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
  } catch (err) {
    return {
      relevant: 'error',
      reason: 'filter error',
      errorDetail: err instanceof Error ? err.message : String(err),
    };
  }
}
