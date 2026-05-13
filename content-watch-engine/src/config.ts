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
  youtubePlaylistId: string;
  port: number;
  logLevel: string;
}

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

export const config: Config = {
  geminiApiKey: requireEnv('GEMINI_API_KEY'),
  youtubeApiKey: requireEnv('YOUTUBE_API_KEY'),
  googleClientId: requireEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
  googleRefreshToken: requireEnv('GOOGLE_REFRESH_TOKEN'),
  webhookPublicUrl: requireEnv('WEBHOOK_PUBLIC_URL'),
  webhookSecret: requireEnv('WEBHOOK_SECRET'),
  databaseUrl: requireEnv('DATABASE_URL'),
  youtubePlaylistId: requireEnv('YOUTUBE_PLAYLIST_ID'),
  port: parseInt(process.env.PORT ?? '3000', 10),
  logLevel: process.env.LOG_LEVEL ?? 'info',
};
