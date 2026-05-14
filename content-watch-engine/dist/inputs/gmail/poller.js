"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGmailPoller = startGmailPoller;
const node_cron_1 = __importDefault(require("node-cron"));
const googleapis_1 = require("googleapis");
const config_1 = require("../../config");
const db_1 = require("../../db");
const filter_1 = require("../../filter");
const sources = 
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('../../../sources.json');
const oauth2Client = new googleapis_1.google.auth.OAuth2(config_1.config.googleClientId, config_1.config.googleClientSecret);
oauth2Client.setCredentials({ refresh_token: config_1.config.googleRefreshToken });
const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
function decodeBase64(encoded) {
    return Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}
function extractContent(payload) {
    if (payload.body?.data)
        return decodeBase64(payload.body.data);
    if (payload.parts) {
        const htmlPart = payload.parts.find((p) => p.mimeType === 'text/html');
        if (htmlPart?.body?.data)
            return decodeBase64(htmlPart.body.data);
        const textPart = payload.parts.find((p) => p.mimeType === 'text/plain');
        if (textPart?.body?.data)
            return decodeBase64(textPart.body.data);
        for (const part of payload.parts) {
            const nested = extractContent(part);
            if (nested)
                return nested;
        }
    }
    return '';
}
function buildFilteredEmail(subject, sourceName, topics) {
    const topicsHtml = topics.map(t => `
    <h3 style="margin:16px 0 4px;font-size:16px">${t.title}</h3>
    <p style="margin:0 0 8px;color:#333;line-height:1.5">${t.description}</p>
    <hr style="border:none;border-top:1px solid #eee;margin:12px 0">
  `).join('');
    return `<html><body style="font-family:sans-serif;max-width:620px;margin:0 auto;padding:16px">
    <p style="color:#888;font-size:12px;margin-bottom:16px">
      Filtered newsletter from <strong>${sourceName}</strong> — ${topics.length} relevant topic${topics.length !== 1 ? 's' : ''}
    </p>
    <hr style="border:none;border-top:2px solid #222;margin-bottom:16px">
    ${topicsHtml}
  </body></html>`;
}
async function archiveMessage(messageId) {
    await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: { removeLabelIds: ['INBOX'] },
    });
}
async function sendEmail(subject, htmlBody) {
    const raw = [
        `To: ${config_1.config.gmailUser}`,
        `Subject: [Filtered] ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        htmlBody,
    ].join('\r\n');
    await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: Buffer.from(raw).toString('base64url') },
    });
}
async function processMessage(messageId, source) {
    const itemId = `gmail:${messageId}`;
    if (await (0, db_1.hasProcessed)(itemId))
        return;
    const msg = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
    const payload = msg.data.payload;
    const subject = payload.headers?.find(h => h.name?.toLowerCase() === 'subject')?.value ?? '(no subject)';
    const content = extractContent(payload);
    if (!content) {
        console.warn(`[gmail] Empty content for message ${messageId}`);
        return;
    }
    console.log(`[gmail] Processing newsletter: ${subject}`);
    const topics = await (0, filter_1.filterNewsletter)(content, source.hint);
    const fakeItem = {
        id: itemId,
        title: subject,
        description: '',
        sourceUrl: '',
        sourceName: source.name,
        hint: source.hint,
        alwaysSave: false,
        output: source.output,
        metadata: { inputPlugin: 'gmail', messageId },
    };
    if (topics.length > 0) {
        const html = buildFilteredEmail(subject, source.name, topics);
        await sendEmail(subject, html);
        await archiveMessage(messageId);
        await (0, db_1.saveDecision)(fakeItem, 'true', `${topics.length} topics matched`);
        console.log(`✅ Sent filtered newsletter: ${subject} (${topics.length} topics)`);
    }
    else {
        await archiveMessage(messageId);
        await (0, db_1.saveDecision)(fakeItem, 'false', 'no relevant topics');
        console.log(`⏭️  No relevant topics in: ${subject}`);
    }
}
async function pollGmail() {
    const gmailSources = sources.filter(s => s.inputPlugin === 'gmail');
    if (gmailSources.length === 0)
        return;
    for (const source of gmailSources) {
        try {
            const res = await gmail.users.messages.list({
                userId: 'me',
                q: `from:${source.id} in:inbox newer_than:14d`,
                maxResults: 10,
            });
            const messages = res.data.messages ?? [];
            for (const msg of messages) {
                if (!msg.id)
                    continue;
                await processMessage(msg.id, source);
            }
        }
        catch (err) {
            console.error(`[gmail] Poll error for ${source.id}:`, err);
        }
    }
}
async function startGmailPoller() {
    if (!config_1.config.gmailUser) {
        console.warn('[gmail] GMAIL_USER not set — gmail poller disabled');
        return;
    }
    await pollGmail();
    // Poll every 4 hours
    node_cron_1.default.schedule('0 */4 * * *', async () => {
        console.log('[gmail] Polling for new newsletters...');
        await pollGmail();
    });
}
