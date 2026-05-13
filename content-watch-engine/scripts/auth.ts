import 'dotenv/config';
import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3001';

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube'],
});

console.log('Starting local server on http://localhost:3001 to capture the OAuth callback...\n');
console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log('');

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url ?? '', true);
  const code = parsed.query.code as string | undefined;

  if (!code) {
    res.writeHead(400);
    res.end('Missing code parameter');
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h2>Auth successful! You can close this tab.</h2>');
  server.close();

  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\nRefresh token obtained:');
    console.log(tokens.refresh_token);
    console.log('\nAdd to .env as: GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
  } catch (err) {
    console.error('Failed to exchange code:', err);
    process.exit(1);
  }
});

server.listen(3001);
