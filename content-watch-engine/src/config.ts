import 'dotenv/config';

interface Config {
  geminiApiKey: string;
  youtubeApiKey: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  webhookPublicUrl: string;
  webhookSecret: string;
  databaseUrl: string;
  port: number;
  logLevel: string;
}

function require(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export const config: Config = {
  geminiApiKey: require('GEMINI_API_KEY'),
  youtubeApiKey: require('YOUTUBE_API_KEY'),
  googleClientId: require('GOOGLE_CLIENT_ID'),
  googleClientSecret: require('GOOGLE_CLIENT_SECRET'),
  googleRefreshToken: require('GOOGLE_REFRESH_TOKEN'),
  webhookPublicUrl: require('WEBHOOK_PUBLIC_URL'),
  webhookSecret: require('WEBHOOK_SECRET'),
  databaseUrl: require('DATABASE_URL'),
  port: parseInt(process.env.PORT ?? '3000', 10),
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
