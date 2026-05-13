"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
require("dotenv/config");
function requireEnv(name) {
    const val = process.env[name];
    if (!val)
        throw new Error(`Missing required environment variable: ${name}`);
    return val;
}
exports.config = {
    geminiApiKey: requireEnv('GEMINI_API_KEY'),
    youtubeApiKey: requireEnv('YOUTUBE_API_KEY'),
    googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
    googleClientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
    googleRefreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
    webhookPublicUrl: requireEnv('WEBHOOK_PUBLIC_URL'),
    webhookSecret: requireEnv('WEBHOOK_SECRET'),
    databaseUrl: requireEnv('DATABASE_URL'),
    port: parseInt(process.env.PORT ?? '3000', 10),
    logLevel: process.env.LOG_LEVEL ?? 'info',
};
