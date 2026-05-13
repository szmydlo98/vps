import 'dotenv/config';
import { google } from 'googleapis';
import * as readline from 'readline';

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  'urn:ietf:wg:oauth:2.0:oob'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/youtube'],
});

console.log('Open this URL in your browser:\n');
console.log(authUrl);
console.log('');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the authorisation code from the redirect URL: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\nRefresh token obtained:');
    console.log(tokens.refresh_token);
    console.log('\nAdd to .env as: GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
  } catch (err) {
    console.error('Failed to exchange code:', err);
    process.exit(1);
  }
});
