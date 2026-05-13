import 'dotenv/config';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

(async () => {
  try {
    const res = await youtube.channels.list({ part: ['snippet'], mine: true });
    console.log('✅ OAuth works. Channel:', res.data.items?.[0]?.snippet?.title);
  } catch (err: any) {
    console.error('❌ OAuth failed:', err.message);
  }
})();
